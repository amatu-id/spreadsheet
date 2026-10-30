// Number-format engine (Excel/Sheets format codes) and typed-input parsing.
import { parts, serial } from './util.js';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const LOCALES = {
  'id-ID': { name: 'Indonesia', dec: ',', grp: '.', dmy: true, date: 'dd/mm/yyyy', cur: 'Rp', months: MONTHS_ID, days: DAYS_ID },
  'en-US': { name: 'Amerika Serikat', dec: '.', grp: ',', dmy: false, date: 'm/d/yyyy', cur: '$', months: MONTHS_EN, days: DAYS_EN },
  'en-GB': { name: 'Inggris Raya', dec: '.', grp: ',', dmy: true, date: 'dd/mm/yyyy', cur: '£', months: MONTHS_EN, days: DAYS_EN },
};

export let L = LOCALES['id-ID'];
export let localeId = 'id-ID';
export function setLocale(id) { localeId = LOCALES[id] ? id : 'id-ID'; L = LOCALES[localeId]; }

const short3 = s => s.slice(0, 3);
const COLORS = { red: '#d93025', blue: '#1a73e8', green: '#188038', yellow: '#f9ab00', magenta: '#c5221f', cyan: '#12b5cb', white: '#ffffff', black: '#000000' };
const XL_COLORS = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

const cache = new Map();

function splitSections(code) {
  const out = [];
  let cur = '', q = false, br = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (q) { cur += ch; if (ch === '"') q = false; continue; }
    if (ch === '"') { q = true; cur += ch; continue; }
    if (ch === '\\') { cur += ch + (code[i + 1] ?? ''); i++; continue; }
    if (ch === '[') br = true;
    else if (ch === ']') br = false;
    if (ch === ';' && !br) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function tokenize(s) {
  const toks = [];
  const lc = s.toLowerCase();
  let i = 0, color = null, cond = null;
  const lit = v => { const last = toks[toks.length - 1]; if (last && last.t === 'lit') last.v += v; else toks.push({ t: 'lit', v }); };
  while (i < s.length) {
    const ch = s[i], c = lc[i];
    if (ch === '"') { let j = s.indexOf('"', i + 1); if (j < 0) j = s.length; lit(s.slice(i + 1, j)); i = j + 1; continue; }
    if (ch === '\\') { lit(s[i + 1] ?? ''); i += 2; continue; }
    if (ch === '_') { lit(' '); i += 2; continue; }
    if (ch === '*') { toks.push({ t: 'fill', v: s[i + 1] ?? ' ' }); i += 2; continue; }
    if (ch === '[') {
      const j = s.indexOf(']', i);
      const inner = s.slice(i + 1, j < 0 ? s.length : j);
      i = j < 0 ? s.length : j + 1;
      let m;
      if (COLORS[inner.toLowerCase()]) color = COLORS[inner.toLowerCase()];
      else if ((m = /^color\s*(\d+)$/i.exec(inner))) color = XL_COLORS[(+m[1] - 1) % 8] || null;
      else if ((m = /^(<=|>=|<>|<|>|=)\s*(-?[\d.]+)$/.exec(inner))) cond = { op: m[1], v: +m[2] };
      else if (inner.startsWith('$')) lit(inner.slice(1).split('-')[0]);
      else if (/^(h+|m+|s+)$/i.test(inner)) toks.push({ t: 'el', v: inner[0].toLowerCase(), n: inner.length });
      continue;
    }
    if (lc.startsWith('general', i)) { toks.push({ t: 'general' }); i += 7; continue; }
    if (lc.startsWith('am/pm', i)) { toks.push({ t: 'ampm', v: 'AM/PM' }); i += 5; continue; }
    if (lc.startsWith('a/p', i)) { toks.push({ t: 'ampm', v: 'A/P' }); i += 3; continue; }
    if ((ch === 'E' || ch === 'e') && (s[i + 1] === '+' || s[i + 1] === '-')) { toks.push({ t: 'exp', v: s[i + 1] }); i += 2; continue; }
    if ('ymdhse'.includes(c)) {
      let j = i;
      while (j < s.length && lc[j] === c) j++;
      toks.push({ t: c === 'e' ? 'y' : c, n: j - i });
      i = j;
      continue;
    }
    if (ch === '0' || ch === '#' || ch === '?') { toks.push({ t: 'ph', v: ch }); i++; continue; }
    if (ch === '.') {
      const prev = toks[toks.length - 1];
      if (prev && prev.t === 's' && s[i + 1] === '0') {
        let j = i + 1; while (s[j] === '0') j++;
        toks.push({ t: 'sub', n: j - i - 1 }); i = j; continue;
      }
      toks.push({ t: 'dot' }); i++; continue;
    }
    if (ch === ',') { toks.push({ t: 'comma' }); i++; continue; }
    if (ch === '%') { toks.push({ t: 'pct' }); i++; continue; }
    if ((ch === 'E' || ch === 'e') && (s[i + 1] === '+' || s[i + 1] === '-')) { toks.push({ t: 'exp', v: s[i + 1] }); i += 2; continue; }
    if (ch === '/') { toks.push({ t: 'slash' }); i++; continue; }
    if (ch === '@') { toks.push({ t: 'at' }); i++; continue; }
    lit(ch); i++;
  }
  return { toks, color, cond };
}

function parseSection(src) {
  const { toks, color, cond } = tokenize(src);
  const sec = { toks, color, cond, src };
  const isDate = toks.some(t => 'ydhs'.includes(t.t) && t.t.length === 1 || t.t === 'el' || t.t === 'ampm') ||
    (toks.some(t => t.t === 'm') && !toks.some(t => t.t === 'ph'));
  if (isDate) {
    sec.type = 'date';
    // decide minute vs month for "m"
    const dt = toks.filter(t => ['y', 'm', 'd', 'h', 's', 'el'].includes(t.t));
    for (let k = 0; k < dt.length; k++) {
      const t = dt[k];
      if (t.t !== 'm') continue;
      const prev = dt[k - 1], next = dt[k + 1];
      if ((prev && (prev.t === 'h' || (prev.t === 'el' && prev.v === 'h'))) || (next && next.t === 's')) t.t = 'min';
    }
    sec.ampm = toks.some(t => t.t === 'ampm');
    sec.sub = toks.find(t => t.t === 'sub')?.n || 0;
    return sec;
  }
  if (toks.some(t => t.t === 'at')) { sec.type = 'text'; return sec; }
  if (toks.some(t => t.t === 'general')) { sec.type = 'general'; return sec; }
  if (!toks.some(t => t.t === 'ph')) { sec.type = 'lit'; return sec; }
  sec.type = 'num';
  analyzeNum(sec);
  return sec;
}

function analyzeNum(sec) {
  const t = sec.toks;
  let first = t.findIndex(x => x.t === 'ph'), last = -1;
  for (let i = t.length - 1; i >= 0; i--) if (t[i].t === 'ph') { last = i; break; }
  sec.pct = t.filter(x => x.t === 'pct').length;
  const slash = t.findIndex((x, i) => x.t === 'slash' && i > first && i < last);
  if (slash >= 0) {
    // fraction: [int ph] lit [num ph] / [den ph or digits]
    sec.frac = true;
    const before = t.slice(first, slash);
    const gap = before.findIndex(x => x.t === 'lit');
    sec.fracWhole = gap > 0;
    sec.fracWholeMin = gap > 0 ? before.slice(0, gap).filter(x => x.v === '0').length : 0;
    const after = t.slice(slash + 1, last + 1);
    const lit = after.filter(x => x.t === 'lit').map(x => x.v).join('');
    const fixed = /^\d+$/.test(lit.trim()) ? +lit.trim() : 0;
    sec.denFixed = fixed;
    sec.denDigits = after.filter(x => x.t === 'ph').length || 1;
    sec.prefix = t.slice(0, first);
    sec.suffix = t.slice(last + 1);
    return;
  }
  const expI = t.findIndex(x => x.t === 'exp');
  const dot = t.findIndex((x, i) => x.t === 'dot' && i > first - 1 && (expI < 0 || i < expI));
  const intEnd = dot >= 0 ? dot : (expI >= 0 ? expI : last + 1);
  const intToks = t.slice(first, intEnd);
  // trailing commas right after the last digit placeholder of the mantissa scale by 1000
  let scale = 0;
  const mantEnd = expI >= 0 ? expI : last + 1;
  for (let i = mantEnd; i < t.length && t[i].t === 'comma'; i++) scale++;
  if (dot < 0) for (let i = intEnd - 1; i >= first && t[i].t === 'comma'; i--) scale++;
  sec.scale = scale;
  sec.grp = intToks.some((x, i) => x.t === 'comma' && intToks.slice(i + 1).some(y => y.t === 'ph'));
  sec.intPh = intToks.filter(x => x.t === 'ph');
  sec.intLits = intToks.some(x => x.t === 'lit');
  sec.intToks = intToks;
  sec.intMin = sec.intPh.filter(x => x.v === '0').length;
  const decToks = dot >= 0 ? t.slice(dot + 1, mantEnd).filter(x => x.t === 'ph' || x.t === 'lit') : [];
  sec.decPh = decToks.filter(x => x.t === 'ph').map(x => x.v);
  sec.dot = dot >= 0;
  if (expI >= 0) {
    sec.exp = { sign: t[expI].v, digits: t.slice(expI + 1).filter(x => x.t === 'ph').length || 1 };
    let e2 = expI + 1; while (e2 < t.length && t[e2].t === 'ph') e2++;
    sec.suffix = t.slice(e2).filter(x => x.t !== 'comma');
  } else {
    sec.suffix = t.slice(last + 1).filter(x => x.t !== 'comma');
  }
  sec.prefix = t.slice(0, first);
  sec.decLits = decToks;
}

export function compile(code) {
  if (!code || code === 'General') return null;
  let c = cache.get(code);
  if (c) return c;
  c = { code, secs: splitSections(code).map(parseSection) };
  c.isDate = c.secs[0].type === 'date';
  c.isPct = c.secs[0].type === 'num' && c.secs[0].pct > 0;
  cache.set(code, c);
  return c;
}

function group(intStr) {
  let out = '';
  for (let i = 0; i < intStr.length; i++) {
    if (i && (intStr.length - i) % 3 === 0) out += L.grp;
    out += intStr[i];
  }
  return out;
}

function litText(toks) {
  let s = '';
  for (const t of toks) {
    if (t.t === 'lit') s += t.v;
    else if (t.t === 'pct') s += '%';
    else if (t.t === 'fill') s += t.v === ' ' ? ' ' : '';
  }
  return s;
}

function fmtNum(x, sec) {
  for (let k = 0; k < sec.pct; k++) x *= 100;
  for (let k = 0; k < sec.scale; k++) x /= 1000;
  if (sec.frac) return fmtFrac(x, sec);
  let e = 0;
  if (sec.exp) {
    if (x !== 0) {
      e = Math.floor(Math.log10(x));
      const step = sec.intPh.length > 1 && sec.intPh.some(p => p.v === '#') ? sec.intPh.length : 1;
      e = Math.floor(e / step) * step - (step === 1 ? sec.intPh.length - 1 : 0);
      x = x / Math.pow(10, e);
    }
  }
  const nd = sec.decPh.length;
  let s = x.toFixed(Math.min(nd, 20));
  if (sec.exp && x !== 0 && parseFloat(s) >= Math.pow(10, Math.max(1, sec.intPh.length))) {
    x /= 10; e += 1; s = x.toFixed(nd);
  }
  let [ip, dp = ''] = s.split('.');
  if (ip === '0' && sec.intMin === 0) ip = '';
  let intOut;
  if (sec.intLits) {
    // fill placeholders right to left, preserving literals (e.g. phone formats)
    const digits = ip.split('');
    const out = [];
    const phIdx = sec.intToks.map((t, i) => t.t === 'ph' ? i : -1).filter(i => i >= 0);
    const firstPh = phIdx[0];
    for (let i = sec.intToks.length - 1; i >= 0; i--) {
      const t = sec.intToks[i];
      if (t.t === 'lit') { out.unshift(t.v); continue; }
      if (t.t !== 'ph') continue;
      if (i === firstPh) { out.unshift(digits.length ? digits.join('') : (t.v === '0' ? '0' : t.v === '?' ? ' ' : '')); digits.length = 0; }
      else if (digits.length) out.unshift(digits.pop());
      else out.unshift(t.v === '0' ? '0' : t.v === '?' ? ' ' : '');
    }
    intOut = out.join('');
  } else {
    while (ip.length < sec.intMin) ip = '0' + ip;
    intOut = sec.grp ? group(ip) : ip;
  }
  let decOut = '';
  if (nd) {
    const d = dp.padEnd(nd, '0').split('');
    for (let i = nd - 1; i >= 0; i--) {
      if (d[i] !== '0') break;
      if (sec.decPh[i] === '#') d[i] = '';
      else if (sec.decPh[i] === '?') d[i] = ' ';
      else break;
    }
    decOut = d.join('');
  }
  let out = litText(sec.prefix) + intOut + (sec.dot && (decOut || sec.decPh.length === 0 || true) ? (nd || sec.dot ? L.dec : '') + decOut : '');
  if (sec.dot && !decOut && !nd) out = litText(sec.prefix) + intOut + L.dec;
  if (sec.exp) {
    const es = String(Math.abs(e)).padStart(sec.exp.digits, '0');
    out += 'E' + (e < 0 ? '-' : sec.exp.sign === '+' ? '+' : '') + es;
  }
  return out + litText(sec.suffix);
}

function fmtFrac(x, sec) {
  let whole = 0, f = x;
  if (sec.fracWhole) { whole = Math.floor(x); f = x - whole; }
  let num, den;
  if (sec.denFixed) { den = sec.denFixed; num = Math.round(f * den); }
  else {
    const maxD = Math.pow(10, sec.denDigits) - 1;
    let best = [0, 1], err = Infinity;
    for (let d = 1; d <= maxD; d++) {
      const n = Math.round(f * d), e = Math.abs(f - n / d);
      if (e < err - 1e-12) { err = e; best = [n, d]; if (e < 1e-10) break; }
    }
    [num, den] = best;
  }
  if (sec.fracWhole && num === den) { whole++; num = 0; }
  let s = '';
  if (sec.fracWhole) s = (whole || !num ? String(whole) : '') + (num ? ' ' : '');
  if (num || !sec.fracWhole) s += num + '/' + den;
  return litText(sec.prefix) + s.trim() + litText(sec.suffix);
}

function fmtDate(v, sec) {
  if (v < 0 && !sec.toks.some(t => t.t === 'el')) return null;
  const p = parts(Math.abs(v));
  let sub = '';
  if (sec.sub) {
    const total = Math.round(Math.abs(v) * 86400 * Math.pow(10, sec.sub));
    sub = String(total % Math.pow(10, sec.sub)).padStart(sec.sub, '0');
  } else if (p.ms >= 0.5) {
    const q = parts(Math.abs(v) + 0.5 / 86400);
    Object.assign(p, q);
  }
  let out = '';
  const pad = (n, w) => String(n).padStart(w, '0');
  for (const t of sec.toks) {
    switch (t.t) {
      case 'lit': out += t.v; break;
      case 'y': out += t.n <= 2 ? pad(p.y % 100, 2) : String(p.y); break;
      case 'm': out += t.n === 1 ? p.m : t.n === 2 ? pad(p.m, 2) : t.n === 3 ? short3(L.months[p.m - 1]) : t.n === 5 ? L.months[p.m - 1][0] : L.months[p.m - 1]; break;
      case 'd': out += t.n === 1 ? p.d : t.n === 2 ? pad(p.d, 2) : t.n === 3 ? short3(L.days[p.dow]) : L.days[p.dow]; break;
      case 'h': { let h = p.H; if (sec.ampm) { h = h % 12; if (h === 0) h = 12; } out += t.n >= 2 ? pad(h, 2) : h; break; }
      case 'min': out += t.n >= 2 ? pad(p.M, 2) : p.M; break;
      case 's': out += t.n >= 2 ? pad(p.S, 2) : p.S; break;
      case 'sub': out += L.dec + sub; break;
      case 'ampm': out += t.v === 'AM/PM' ? (p.H < 12 ? 'AM' : 'PM') : (p.H < 12 ? 'A' : 'P'); break;
      case 'el': {
        const totalS = Math.round(Math.abs(v) * 86400);
        const val = t.v === 'h' ? Math.floor(totalS / 3600) : t.v === 'm' ? Math.floor(totalS / 60) : totalS;
        out += (v < 0 ? '-' : '') + pad(val, t.n);
        break;
      }
      case 'pct': out += '%'; break;
      case 'comma': out += ','; break;
      case 'dot': out += '.'; break;
      case 'slash': out += '/'; break;
      case 'ph': out += t.v === '0' ? '0' : ''; break;
      default: break;
    }
  }
  return out;
}

// General display of numbers (≈ Sheets "Otomatis").
export function general(v) {
  if (!isFinite(v)) return '#NUM!';
  if (v === 0) return '0';
  const a = Math.abs(v);
  let s;
  if (a >= 1e15 || a < 1e-9) {
    s = v.toExponential(5).replace(/\.?0+e/, 'e');
    const [m, e] = s.split('e');
    const en = +e;
    s = m + 'E' + (en < 0 ? '-' : '+') + String(Math.abs(en)).padStart(2, '0');
  } else if (Number.isInteger(v)) s = String(v);
  else {
    s = String(parseFloat(v.toPrecision(11)));
    if (s.includes('e')) s = v.toFixed(10).replace(/0+$/, '');
  }
  return L.dec === '.' ? s : s.replace('.', L.dec);
}

export function fmtBool(b) { return b ? 'TRUE' : 'FALSE'; }

// Main entry. Returns {t: text, color} — color optional.
export function format(v, code) {
  if (v == null) return { t: '' };
  if (typeof v === 'boolean') return { t: fmtBool(v) };
  if (typeof v === 'object') return { t: v.code || '' };
  const c = compile(code);
  if (typeof v === 'string') {
    if (!c) return { t: v };
    const ts = c.secs.length >= 4 ? c.secs[3] : c.secs.find(s => s.type === 'text');
    if (!ts) return { t: v };
    let out = '';
    for (const t of ts.toks) out += t.t === 'at' ? v : t.t === 'lit' ? t.v : '';
    return { t: out, color: ts.color };
  }
  if (!c) return { t: general(v) };
  let sec, neg = v < 0, x = v;
  const secs = c.secs;
  if (secs.some(s => s.cond)) {
    sec = secs.find(s => s.cond && cmp(v, s.cond)) || secs.find(s => !s.cond && s.type !== 'text') || secs[0];
    if (sec !== secs[0] || !sec.cond || sec.cond.v >= 0 && neg) x = Math.abs(v);
    neg = neg && sec === secs[secs.length - 1] && !sec.cond && secs.length < 3;
  } else if (secs.length === 1 || (secs.length === 2 && secs[1].type === 'text')) {
    sec = secs[0];
  } else if (v > 0 || (v === 0 && secs.length === 2)) sec = secs[0];
  else if (v < 0) { sec = secs[1]; x = -v; neg = false; }
  else sec = secs[2] && secs[2].type !== 'text' ? secs[2] : secs[0];
  if (sec.type === 'text') return { t: general(v) };
  if (sec.type === 'general') return { t: litText(sec.toks.filter(t => t.t === 'lit')) + general(v), color: sec.color };
  if (sec.type === 'lit') return { t: litText(sec.toks), color: sec.color };
  if (sec.type === 'date') {
    const s = fmtDate(x, sec);
    return s == null ? { t: '#'.repeat(6) } : { t: s, color: sec.color };
  }
  let s = fmtNum(Math.abs(x), sec);
  if (neg && /[1-9]/.test(s)) s = '-' + s;
  return { t: s, color: sec.color };
}

function cmp(v, c) {
  switch (c.op) {
    case '<': return v < c.v; case '>': return v > c.v; case '<=': return v <= c.v;
    case '>=': return v >= c.v; case '=': return v === c.v; case '<>': return v !== c.v;
  }
  return false;
}

export const isDateFmt = code => !!compile(code)?.isDate;
export const fmtSmart = v => format(+(+v).toPrecision(12), Number.isInteger(+(+v).toPrecision(12)) ? '#,##0' : '#,##0.00').t;

// Adjusts the number of decimals in a format code (toolbar .0 / .00 buttons).
export function changeDecimals(code, delta, sample) {
  if (!code || code === 'General') {
    let d = 0;
    if (typeof sample === 'number' && !Number.isInteger(sample)) {
      const g = String(parseFloat(sample.toPrecision(10)));
      d = (g.split('.')[1] || '').length;
    }
    d = Math.max(0, d + delta);
    return d ? '0.' + '0'.repeat(d) : '0';
  }
  return splitSections(code).map(sec => {
    if (/[ymdhs]/i.test(sec.replace(/"[^"]*"|\[[^\]]*\]/g, ''))) return sec;
    const m = /([0#?])(\.([0#?]+))?(?![\s\S]*[0#?])/.exec(sec);
    if (!m) return sec;
    const decs = m[3] || '';
    let nd = decs.length + delta;
    if (nd < 0) nd = 0;
    const rep = m[1] + (nd ? '.' + '0'.repeat(nd) : '');
    return sec.slice(0, m.index) + rep + sec.slice(m.index + m[0].length);
  }).join(';');
}

// ---- Input parsing ----
function monthIndex(name) {
  const n = name.toLowerCase();
  for (const list of [MONTHS_ID, MONTHS_EN]) {
    const i = list.findIndex(m => m.toLowerCase() === n || m.toLowerCase().slice(0, 3) === n);
    if (i >= 0) return i + 1;
  }
  if (n === 'agt' || n === 'ags') return 8;
  if (n === 'okt') return 10; if (n === 'des') return 12; if (n === 'mei') return 5;
  return -1;
}

export function parseNumber(s, loc = L) {
  let t = s.trim();
  if (!t) return null;
  let neg = false, pct = false, cur = null;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1).trim(); }
  if (t[0] === '-' || t[0] === '+') { neg = neg !== (t[0] === '-'); t = t.slice(1).trim(); }
  const cm = /^(Rp\.?|IDR|\$|US\$|€|£|¥)\s*/i.exec(t);
  if (cm) { cur = cm[1]; t = t.slice(cm[0].length); }
  if (t[0] === '-') { neg = !neg; t = t.slice(1); }
  if (t.endsWith('%')) { pct = true; t = t.slice(0, -1).trim(); }
  if (!/^[\d.,]+(e[+-]?\d+)?$/i.test(t) || !/\d/.test(t)) return null;
  let num;
  const dec = cur && /^(\$|US\$|£|€)$/i.test(cur) ? '.' : loc.dec;
  const grp = dec === '.' ? ',' : '.';
  const hasDec = t.includes(dec), hasGrp = t.includes(grp);
  if (/e/i.test(t)) num = parseFloat(t.replace(',', '.'));
  else if (hasDec && t.split(dec).length > 2) return null;
  else {
    let ip = t, fp = '';
    if (hasDec) [ip, fp] = t.split(dec);
    if (hasGrp) {
      if (!new RegExp('^\\d{1,3}(\\' + grp + '\\d{3})+$').test(ip)) {
        // dot used as decimal point in a comma locale (e.g. "1.5")
        if (!hasDec && grp === '.' && /^\d+\.\d+$/.test(ip)) { num = parseFloat(ip); ip = null; }
        else if (!hasDec && grp === ',' && /^\d+,\d+$/.test(ip)) { num = parseFloat(ip.replace(',', '.')); ip = null; }
        else return null;
      } else ip = ip.split(grp).join('');
    }
    if (ip !== null) num = parseFloat(ip + (fp ? '.' + fp : ''));
  }
  if (!isFinite(num)) return null;
  if (neg) num = -num;
  let fmt = null;
  if (pct) { num /= 100; fmt = /[.,]\d/.test(t) ? '0.00%' : '0%'; }
  else if (cur) {
    const sym = /^rp|^idr/i.test(cur) ? 'Rp' : cur.toUpperCase() === 'US$' ? '$' : cur;
    const decs = new RegExp('\\' + dec + '\\d').test(t) ? '.00' : '';
    fmt = '"' + sym + '"#,##0' + decs;
  } else if (hasGrp && !hasDec && num !== null && /\d{1,3}([.,]\d{3})+/.test(t)) fmt = '#,##0';
  else if (hasGrp && hasDec) fmt = '#,##0.' + '0'.repeat(Math.min(10, (t.split(dec)[1] || '').length));
  return { v: num, fmt };
}

function parseTimePart(s) {
  const m = /^(\d{1,2})[:.](\d{2})(?:[:.](\d{2})(?:[.,](\d+))?)?\s*(am|pm|a|p)?$/i.exec(s.trim());
  if (!m) return null;
  let H = +m[1];
  const M = +m[2], S = m[3] ? +m[3] + (m[4] ? +('0.' + m[4]) : 0) : 0;
  if (m[5]) { const pm = /^p/i.test(m[5]); if (H > 12) return null; if (H === 12) H = 0; if (pm) H += 12; }
  if (M > 59 || S >= 60 || H > 47) return null;
  return { t: (H * 3600 + M * 60 + S) / 86400, sec: !!m[3], ampm: !!m[5] };
}

export function parseDate(s, loc = L) {
  const t = s.trim();
  let m, y, mo, d, rest = '';
  if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](.+))?$/.exec(t))) { y = +m[1]; mo = +m[2]; d = +m[3]; rest = m[4] || ''; }
  else if ((m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:\s+(.+))?$/.exec(t))) {
    const a = +m[1], b = +m[2];
    if (loc.dmy) { d = a; mo = b; } else { mo = a; d = b; }
    y = +m[3]; rest = m[4] || '';
    if (/^\d{2}$/.test(m[3])) y += y < 50 ? 2000 : 1900;
    if (/\./.test(t) && /^\d{1,2}\.\d{1,2}$/.test(m[1] + '.' + m[2]) && !/\d\.\d{1,2}\.\d{2,4}/.test(t)) return null;
  } else if ((m = /^(\d{1,2})[\s-]+([A-Za-z]{3,})\.?[\s-,]+(\d{2,4})(?:\s+(.+))?$/.exec(t))) {
    d = +m[1]; mo = monthIndex(m[2]); y = +m[3]; rest = m[4] || '';
    if (y < 100) y += y < 50 ? 2000 : 1900;
  } else if ((m = /^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})(?:\s+(.+))?$/.exec(t))) {
    mo = monthIndex(m[1]); d = +m[2]; y = +m[3]; rest = m[4] || '';
  } else if ((m = /^(\d{1,2})[/-](\d{1,2})$/.exec(t))) {
    const a = +m[1], b = +m[2];
    if (loc.dmy) { d = a; mo = b; } else { mo = a; d = b; }
    y = new Date().getFullYear();
  } else {
    const tp = parseTimePart(t);
    if (tp) return { v: tp.t, fmt: tp.ampm ? (tp.sec ? 'h:mm:ss AM/PM' : 'h:mm AM/PM') : (tp.sec ? 'hh:mm:ss' : 'hh:mm') };
    return null;
  }
  if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y >= 1 && y <= 9999)) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1) return null;
  let v = serial(y, mo, d), fmt = loc.date;
  if (rest) {
    const tp = parseTimePart(rest);
    if (!tp) return null;
    v += tp.t;
    fmt += tp.ampm ? ' h:mm:ss AM/PM' : ' hh:mm:ss';
  }
  return { v, fmt };
}

// Converts typed text into a cell value. Returns {v, fmt?, f?}.
export function parseInput(text) {
  if (text == null || text === '') return { v: null };
  if (text[0] === '=' && text.length > 1) return { f: text.slice(1) };
  if (text[0] === "'") return { v: text.slice(1), quoted: true };
  const up = text.trim().toUpperCase();
  if (up === 'TRUE' || up === 'BENAR') return { v: true };
  if (up === 'FALSE' || up === 'SALAH') return { v: false };
  const n = parseNumber(text);
  if (n) return n;
  const d = parseDate(text);
  if (d) return d;
  return { v: text };
}

// Turns a stored value back into editable text.
export function editText(v, fmt) {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') {
    const c = compile(fmt);
    if (c && c.isDate) {
      const hasTime = c.secs[0].toks.some(t => t.t === 'h' || t.t === 'min' || t.t === 's');
      const hasDate = c.secs[0].toks.some(t => t.t === 'y' || t.t === 'd' || t.t === 'm');
      let code = hasDate ? L.date : '';
      if (hasTime || (!hasDate && !hasTime)) code += (code ? ' ' : '') + 'hh:mm:ss';
      if (v % 1 === 0 && hasDate) code = L.date;
      return format(v, code).t;
    }
    if (c && c.isPct) return general(+(v * 100).toPrecision(12)) + '%';
    return general(v);
  }
  return String(v);
}

export const NUMBER_FORMATS = () => [
  { id: 'General', label: 'Otomatis', sample: '' },
  { id: '@', label: 'Teks biasa', sample: '' },
  { sep: true },
  { id: '#,##0.00', label: 'Angka', sample: format(1000.12, '#,##0.00').t },
  { id: '0.00%', label: 'Persen', sample: format(0.1012, '0.00%').t },
  { id: '0.00E+00', label: 'Ilmiah', sample: format(1010, '0.00E+00').t },
  { sep: true },
  { id: '_("Rp"* #,##0.00_);_("Rp"* (#,##0.00);_("Rp"* "-"??_);_(@_)', label: 'Akuntansi', sample: 'Rp (1.000,12)' },
  { id: '#,##0.00;(#,##0.00)', label: 'Keuangan', sample: format(-1000.12, '#,##0.00;(#,##0.00)').t },
  { id: '"Rp"#,##0.00', label: 'Mata uang', sample: format(1000.12, '"Rp"#,##0.00').t },
  { id: '"Rp"#,##0', label: 'Mata uang (dibulatkan)', sample: format(1000, '"Rp"#,##0').t },
  { sep: true },
  { id: L.date, label: 'Tanggal', sample: format(serial(2026, 9, 26), L.date).t },
  { id: 'hh:mm:ss', label: 'Waktu', sample: format(0.6458, 'hh:mm:ss').t },
  { id: L.date + ' hh:mm:ss', label: 'Tanggal waktu', sample: format(serial(2026, 9, 26, 15, 59), L.date + ' hh:mm:ss').t },
  { id: '[h]:mm:ss', label: 'Durasi', sample: '24:01:00' },
];

export const MORE_FORMATS = [
  ['Mata uang', ['"Rp"#,##0', '"Rp"#,##0.00', '"$"#,##0.00', '"€"#,##0.00', '"£"#,##0.00', '"¥"#,##0', '#,##0.00 "USD"']],
  ['Tanggal & waktu', ['d mmmm yyyy', 'dddd, d mmmm yyyy', 'd mmm yyyy', 'mmmm yyyy', 'mmm yy', 'dd-mm-yyyy', 'yyyy-mm-dd', 'h:mm AM/PM', 'hh:mm', 'dd/mm/yyyy hh:mm', 'yyyy-mm-dd hh:mm:ss']],
  ['Angka', ['0', '0.0', '#,##0', '#,##0.000', '0%', '0.0%', '# ?/?', '# ??/??', '0.00E+00', '#,##0,"rb"', '#,##0,,"jt"', '#,##0;[Red]-#,##0', '#,##0;[Red](#,##0)', '000000']],
];
