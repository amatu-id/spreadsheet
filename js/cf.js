// Conditional formatting and data-validation evaluation.
import { FErr } from './formula/core.js';
import { parse } from './formula/parse.js';
import { parseDate } from './format.js';
import { inRange, jsDateToSerial, key } from './util.js';

const astCache = new Map();
function ast(text) {
  let a = astCache.get(text);
  if (a === undefined) { try { a = parse(String(text).replace(/^=/, '')); } catch { a = null; } astCache.set(text, a); }
  return a;
}

function truthy(v) {
  if (v instanceof FErr || v == null) return false;
  if (Array.isArray(v)) v = v[0]?.[0];
  if (v && typeof v === 'object' && 'r1' in v) v = v.value();
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.toUpperCase() === 'TRUE';
  return false;
}

// Evaluates a rule operand: plain value or "=formula" relative to rule's top-left.
function operand(eng, sh, raw, g, r, c) {
  if (raw == null || raw === '') return null;
  const s = String(raw);
  if (s.startsWith('=')) {
    const a = ast(s);
    if (!a) return null;
    let v = eng.evalAst(a, sh, g.r1, g.c1, r - g.r1, c - g.c1);
    if (v && typeof v === 'object' && 'r1' in v) v = v.value();
    if (Array.isArray(v)) v = v[0]?.[0];
    return v;
  }
  const n = Number(s.replace(',', '.'));
  if (s.trim() !== '' && !isNaN(n)) return n;
  const d = parseDate(s);
  if (d) return d.v;
  return s;
}

const today = () => Math.floor(jsDateToSerial(new Date()));

function stats(eng, sh, rule) {
  const vals = [];
  for (const g of rule.ranges) {
    const r2 = Math.min(g.r2, sh.rows - 1), c2 = Math.min(g.c2, sh.cols - 1, Math.max(g.c1, sh.dataCols() - 1));
    const rr2 = Math.min(r2, Math.max(g.r1, sh.dataRows() - 1));
    for (let r = g.r1; r <= rr2; r++) for (let c = g.c1; c <= c2; c++) vals.push(eng.value(sh, r, c));
  }
  const nums = vals.filter(v => typeof v === 'number');
  const st = { nums, min: Math.min(...nums), max: Math.max(...nums) };
  st.avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  st.sorted = nums.slice().sort((a, b) => a - b);
  st.counts = new Map();
  for (const v of vals) {
    if (v == null || v === '') continue;
    const k = typeof v === 'string' ? 's' + v.toLowerCase() : typeof v + v;
    st.counts.set(k, (st.counts.get(k) || 0) + 1);
  }
  return st;
}

function pointValue(p, st) {
  if (!p || p.type === 'min') return st.min;
  if (p.type === 'max') return st.max;
  if (p.type === 'num') return Number(p.v);
  if (p.type === 'pct') return st.min + (st.max - st.min) * Number(p.v) / 100;
  if (p.type === 'pctl') { const s = st.sorted; if (!s.length) return 0; const h = (s.length - 1) * Number(p.v) / 100, lo = Math.floor(h); return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]); }
  return st.min;
}

function hex(c) { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(c || '#ffffff'); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255]; }
function mix(a, b, t) { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

export class CFEngine {
  constructor(app) { this.app = app; this.cid = -1; this.cache = new Map(); this.statCache = new Map(); }
  reset() { this.cache.clear(); this.statCache.clear(); }
  result(sh, r, c) {
    if (!sh.cf.length) return null;
    const eng = sh.wb.eng;
    if (this.cid !== eng.cid || this.sheet !== sh || this.ver !== sh.cfVer) { this.cid = eng.cid; this.sheet = sh; this.ver = sh.cfVer; this.reset(); }
    const k = key(r, c);
    if (this.cache.has(k)) return this.cache.get(k);
    let out = null;
    for (const rule of sh.cf) {
      const g = rule.ranges.find(x => inRange(x, r, c));
      if (!g) continue;
      const res = this.evalRule(eng, sh, rule, g, r, c);
      if (!res) continue;
      out = out || {};
      for (const [p, v] of Object.entries(res)) if (out[p] === undefined && v != null && v !== '') out[p] = v;
      if (rule.stop) break;
    }
    this.cache.set(k, out);
    return out;
  }
  ruleStats(eng, sh, rule) {
    let st = this.statCache.get(rule.id);
    if (!st) { st = stats(eng, sh, rule); this.statCache.set(rule.id, st); }
    return st;
  }
  evalRule(eng, sh, rule, g, r, c) {
    const v = eng.value(sh, r, c);
    const style = rule.style || {};
    const ok = () => style;
    switch (rule.type) {
      case 'scale': {
        if (typeof v !== 'number') return null;
        const st = this.ruleStats(eng, sh, rule);
        const s = rule.scale || {};
        const lo = pointValue(s.min, st), hi = pointValue(s.max, st);
        const cMin = s.min?.color || '#f8696b', cMax = s.max?.color || '#63be7b';
        if (s.mid) {
          const mid = pointValue(s.mid, st), cMid = s.mid.color || '#ffeb84';
          if (v <= mid) return { bg: mix(cMin, cMid, hi === lo || mid === lo ? 0 : Math.max(0, Math.min(1, (v - lo) / (mid - lo)))) };
          return { bg: mix(cMid, cMax, hi === mid ? 1 : Math.max(0, Math.min(1, (v - mid) / (hi - mid)))) };
        }
        return { bg: mix(cMin, cMax, hi === lo ? 1 : Math.max(0, Math.min(1, (v - lo) / (hi - lo)))) };
      }
      case 'bar': {
        if (typeof v !== 'number') return null;
        const st = this.ruleStats(eng, sh, rule);
        const lo = Math.min(0, st.min), hi = Math.max(0, st.max);
        if (hi === lo) return null;
        const zero = (0 - lo) / (hi - lo);
        const pct = (v - lo) / (hi - lo);
        return { bar: { from: Math.min(zero, pct), to: Math.max(zero, pct), neg: v < 0, color: rule.bar?.color || '#638ec6', solid: !!rule.bar?.solid } };
      }
      case 'icons': {
        if (typeof v !== 'number') return null;
        const st = this.ruleStats(eng, sh, rule);
        const t = st.max === st.min ? 1 : (v - st.min) / (st.max - st.min);
        let idx = t >= 0.67 ? 2 : t >= 0.33 ? 1 : 0;
        if (rule.icons?.reverse) idx = 2 - idx;
        return { icon: { set: rule.icons?.set || 'arrows', idx } };
      }
      case 'empty': return v == null || v === '' ? ok() : null;
      case 'notEmpty': return v != null && v !== '' ? ok() : null;
      case 'error': return v instanceof FErr ? ok() : null;
      case 'noError': return !(v instanceof FErr) ? ok() : null;
      case 'text': {
        if (v == null) return null;
        const t = String(v instanceof FErr ? v.code : v).toLowerCase(), q = String(operand(eng, sh, rule.v1, g, r, c) ?? '').toLowerCase();
        const m = { contains: t.includes(q), notContains: !t.includes(q), starts: t.startsWith(q), ends: t.endsWith(q), exact: t === q }[rule.op];
        return m ? ok() : null;
      }
      case 'date': {
        if (typeof v !== 'number') return null;
        const d = Math.floor(v), td = today();
        const ref = rule.v1 === 'today' ? td : rule.v1 === 'yesterday' ? td - 1 : rule.v1 === 'tomorrow' ? td + 1 : Math.floor(Number(operand(eng, sh, rule.v1, g, r, c)));
        let m = false;
        if (rule.op === 'is') {
          if (rule.v1 === 'week') m = d > td - 7 && d <= td;
          else if (rule.v1 === 'month') m = d > td - 30 && d <= td;
          else if (rule.v1 === 'year') m = d > td - 365 && d <= td;
          else m = d === ref;
        } else if (rule.op === 'before') m = d < ref;
        else if (rule.op === 'after') m = d > ref;
        return m ? ok() : null;
      }
      case 'num': {
        if (v == null || v === '' || v instanceof FErr) return null;
        const a = operand(eng, sh, rule.v1, g, r, c), b = operand(eng, sh, rule.v2, g, r, c);
        const cmp = (x, y) => {
          if (typeof x === 'number' && typeof y === 'number') return x - y;
          const p = String(x).toLowerCase(), q = String(y).toLowerCase();
          return p < q ? -1 : p > q ? 1 : 0;
        };
        if (a == null && rule.op !== 'between') return null;
        let m;
        switch (rule.op) {
          case 'gt': m = cmp(v, a) > 0; break; case 'ge': m = cmp(v, a) >= 0; break;
          case 'lt': m = cmp(v, a) < 0; break; case 'le': m = cmp(v, a) <= 0; break;
          case 'eq': m = cmp(v, a) === 0; break; case 'ne': m = cmp(v, a) !== 0; break;
          case 'between': m = b != null && cmp(v, Math.min(a, b)) >= 0 && cmp(v, Math.max(a, b)) <= 0; break;
          case 'notBetween': m = b != null && (cmp(v, Math.min(a, b)) < 0 || cmp(v, Math.max(a, b)) > 0); break;
          default: m = false;
        }
        if (typeof v !== 'number' && typeof a === 'number') m = false;
        return m ? ok() : null;
      }
      case 'formula': {
        const a = ast(rule.v1 || '');
        if (!a) return null;
        return truthy(eng.evalAst(a, sh, g.r1, g.c1, r - g.r1, c - g.c1)) ? ok() : null;
      }
      case 'dup': case 'unique': {
        if (v == null || v === '') return null;
        const st = this.ruleStats(eng, sh, rule);
        const k = typeof v === 'string' ? 's' + v.toLowerCase() : typeof v + v;
        const n = st.counts.get(k) || 0;
        return (rule.type === 'dup' ? n > 1 : n === 1) ? ok() : null;
      }
      case 'top': case 'bottom': {
        if (typeof v !== 'number') return null;
        const st = this.ruleStats(eng, sh, rule);
        let n = Number(rule.v1) || 10;
        if (rule.pct) n = Math.max(1, Math.floor(st.sorted.length * n / 100));
        const s = st.sorted;
        const th = rule.type === 'top' ? s[Math.max(0, s.length - n)] : s[Math.min(s.length - 1, n - 1)];
        return (rule.type === 'top' ? v >= th : v <= th) ? ok() : null;
      }
      case 'above': case 'below': {
        if (typeof v !== 'number') return null;
        const st = this.ruleStats(eng, sh, rule);
        return (rule.type === 'above' ? v > st.avg : v < st.avg) ? ok() : null;
      }
      default: return null;
    }
  }
}

// ---- data validation ----
export function dvAt(sh, r, c) {
  for (let i = sh.dv.length - 1; i >= 0; i--) { const d = sh.dv[i]; if (d.ranges.some(g => inRange(g, r, c))) return d; }
  return null;
}

export function dvItems(sh, rule) {
  if (rule.type === 'list') return (rule.items || []).map(String);
  if (rule.type === 'range' && rule.src) {
    const eng = sh.wb.eng;
    let v = eng.evalText('=' + rule.src, sh, 0, 0);
    if (v && typeof v === 'object' && 'r1' in v) v = v.toArray();
    if (!Array.isArray(v)) v = [[v]];
    const out = [];
    for (const row of v) for (const x of row) if (x != null && x !== '' && !(x instanceof FErr)) { const s = String(x); if (!out.includes(s)) out.push(s); }
    return out;
  }
  return [];
}

export function dvValid(sh, rule, r, c, v) {
  if (v == null || v === '') return true;
  const eng = sh.wb.eng;
  const g = rule.ranges.find(x => inRange(x, r, c)) || rule.ranges[0];
  switch (rule.type) {
    case 'list': case 'range': {
      const items = dvItems(sh, rule).map(s => s.toLowerCase());
      const vals = rule.multi ? String(v).split(',').map(s => s.trim().toLowerCase()) : [String(v).toLowerCase()];
      return vals.every(x => items.includes(x));
    }
    case 'checkbox': {
      const on = rule.checked ?? true, off = rule.unchecked ?? false;
      return v === on || v === off || String(v) === String(on) || String(v) === String(off);
    }
    case 'number': case 'date': case 'textlen': {
      const x = rule.type === 'textlen' ? String(v).length : v;
      if (typeof x !== 'number') return false;
      const a = Number(operand(eng, sh, rule.v1, g, r, c)), b = Number(operand(eng, sh, rule.v2, g, r, c));
      switch (rule.op) {
        case 'between': return x >= Math.min(a, b) && x <= Math.max(a, b);
        case 'notBetween': return x < Math.min(a, b) || x > Math.max(a, b);
        case 'gt': return x > a; case 'ge': return x >= a; case 'lt': return x < a; case 'le': return x <= a;
        case 'eq': return x === a; case 'ne': return x !== a;
      }
      return true;
    }
    case 'text': {
      const t = String(v).toLowerCase(), q = String(rule.v1 || '').toLowerCase();
      if (rule.op === 'contains') return t.includes(q);
      if (rule.op === 'notContains') return !t.includes(q);
      if (rule.op === 'exact') return t === q;
      if (rule.op === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
      if (rule.op === 'url') return /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(t);
      return true;
    }
    case 'custom': {
      const a = ast(rule.v1 || '');
      return a ? truthy(eng.evalAst(a, sh, g.r1, g.c1, r - g.r1, c - g.c1)) : true;
    }
  }
  return true;
}

export const CHIP_COLORS = ['#e8eaed', '#c6dafc', '#ceead6', '#fce8b2', '#fad2cf', '#e9d2fd', '#d2e3fc', '#fde2c6', '#c9f0f0', '#ffd8e4'];
