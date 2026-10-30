// Formula lexer, parser and reference rewriting.
import { colIndex, colName, quoteSheet, MAXC, MAXR } from '../util.js';

const ID_START = /[A-Za-z_\\À-￿]/;
const ID_REST = /[\w.À-￿]/;
const ERR_RE = /^#(NULL!|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|SPILL!|CALC!|ERROR!)/i;

function lexRef(src, i) {
  let j = i, sheet = null;
  if (src[j] === "'") {
    let k = j + 1, name = '';
    while (k < src.length) {
      if (src[k] === "'") { if (src[k + 1] === "'") { name += "'"; k += 2; continue; } break; }
      name += src[k++];
    }
    if (src[k] !== "'" || src[k + 1] !== '!') return null;
    sheet = name; j = k + 2;
  } else {
    const m = /^[A-Za-z_À-￿][\w.À-￿]*!/.exec(src.slice(j, j + 120));
    if (m) { sheet = m[0].slice(0, -1); j += m[0].length; }
  }
  const rest = src.slice(j, j + 40);
  let m, a = null;
  const after = k => src[k] === undefined || !(ID_REST.test(src[k]) || src[k] === '(' || src[k] === '!');
  if ((m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)/.exec(rest))) {
    let k = j + m[0].length;
    const c1 = colIndex(m[2]), r1 = +m[4] - 1;
    if (c1 >= MAXC || r1 < 0 || r1 >= MAXR) return null;
    a = { kind: 'cell', r1, c1, r2: r1, c2: c1, ar1: !!m[3], ac1: !!m[1], ar2: !!m[3], ac2: !!m[1] };
    if (src[k] === ':') {
      const r2s = src.slice(k + 1, k + 30);
      let m2;
      if ((m2 = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)/.exec(r2s)) && after(k + 1 + m2[0].length)) {
        Object.assign(a, { kind: 'range', c2: colIndex(m2[2]), r2: +m2[4] - 1, ac2: !!m2[1], ar2: !!m2[3] });
        k += 1 + m2[0].length;
      } else if ((m2 = /^(\$?)([A-Za-z]{1,3})(?![\w(])/.exec(r2s))) {
        Object.assign(a, { kind: 'range', c2: colIndex(m2[2]), r2: Infinity, ac2: !!m2[1], ar2: false });
        k += 1 + m2[0].length;
      }
    }
    if (a.kind === 'cell') {
      if (src[k] === '#') { a.spill = true; k++; }
      else if (!after(k)) return null;
    } else if (!after(k)) return null;
    return { t: 'ref', sheet, a, s: src.slice(i, k), p: i };
  }
  if ((m = /^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})/.exec(rest)) && after(j + m[0].length)) {
    return { t: 'ref', sheet, s: src.slice(i, j + m[0].length), p: i, a: { kind: 'col', r1: 0, c1: colIndex(m[2]), r2: Infinity, c2: colIndex(m[4]), ar1: false, ac1: !!m[1], ar2: false, ac2: !!m[3] } };
  }
  if ((m = /^(\$?)(\d+):(\$?)(\d+)/.exec(rest)) && after(j + m[0].length) && +m[2] > 0 && +m[4] > 0) {
    return { t: 'ref', sheet, s: src.slice(i, j + m[0].length), p: i, a: { kind: 'row', r1: +m[2] - 1, c1: 0, r2: +m[4] - 1, c2: Infinity, ar1: !!m[1], ac1: false, ar2: !!m[3], ac2: false } };
  }
  return null;
}

export function lex(src) {
  const toks = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      let j = i; while (j < n && /\s/.test(src[j])) j++;
      toks.push({ t: 'ws', s: src.slice(i, j), p: i }); i = j; continue;
    }
    if (ch === '"') {
      let j = i + 1, v = '';
      while (j < n) {
        if (src[j] === '"') { if (src[j + 1] === '"') { v += '"'; j += 2; continue; } break; }
        v += src[j++];
      }
      toks.push({ t: 'str', v, s: src.slice(i, j + 1), p: i, open: j >= n }); i = j + 1; continue;
    }
    if (ch === '#') {
      const m = ERR_RE.exec(src.slice(i, i + 9));
      if (m) { toks.push({ t: 'err', v: m[0].toUpperCase(), s: m[0], p: i }); i += m[0].length; continue; }
    }
    if (ch === "'" || ID_START.test(ch) || ch === '$' || /\d/.test(ch)) {
      const r = (ch === "'" || ID_START.test(ch) || ch === '$' || /\d/.test(ch)) ? lexRef(src, i) : null;
      if (r) { toks.push(r); i += r.s.length; continue; }
    }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] || ''))) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(src.slice(i));
      toks.push({ t: 'num', v: parseFloat(m[0]), s: m[0], p: i }); i += m[0].length; continue;
    }
    if (ID_START.test(ch)) {
      const m = /^[A-Za-z_\\À-￿][\w.À-￿]*/.exec(src.slice(i));
      toks.push({ t: 'id', v: m[0], s: m[0], p: i }); i += m[0].length; continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '<=' || two === '>=' || two === '<>') { toks.push({ t: 'op', v: two, s: two, p: i }); i += 2; continue; }
    if ('+-*/^&=<>%@'.includes(ch)) { toks.push({ t: 'op', v: ch, s: ch, p: i }); i++; continue; }
    if ('(),;{}:'.includes(ch)) { toks.push({ t: ch, s: ch, p: i }); i++; continue; }
    toks.push({ t: 'bad', s: ch, p: i }); i++;
  }
  return toks;
}

const BIN = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 };

export class FormulaError extends Error {}

export function parse(src) {
  const toks = lex(src).filter(t => t.t !== 'ws');
  let pos = 0;
  const peek = () => toks[pos];
  const next = () => toks[pos++];
  const fail = msg => { throw new FormulaError(msg); };
  const expect = t => { const k = next(); if (!k || k.t !== t) fail(`Diharapkan "${t}"`); return k; };

  function expr(min = 0) {
    let left = unary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op') break;
      const p = BIN[t.v];
      if (p === undefined || p < min) break;
      next();
      const right = expr(p + 1);
      left = { type: 'bin', op: t.v, a: left, b: right };
    }
    return left;
  }
  function unary() {
    const t = peek();
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) {
      next();
      const a = unary();
      return t.v === '-' ? { type: 'neg', a } : { type: 'pos', a };
    }
    if (t && t.t === 'op' && t.v === '@') { next(); return { type: 'isect', a: unary() }; }
    return postfix(primary());
  }
  function postfix(node) {
    for (;;) {
      const t = peek();
      if (t && t.t === 'op' && t.v === '%') { next(); node = { type: 'pct', a: node }; continue; }
      if (t && t.t === ':') { next(); node = { type: 'rangeop', a: node, b: primary() }; continue; }
      if (t && t.t === '(' && (node.type === 'call' || node.type === 'paren')) { next(); node = { type: 'invoke', fn: node, args: args() }; continue; }
      break;
    }
    return node;
  }
  function args() {
    const out = [];
    if (peek() && peek().t === ')') { next(); return out; }
    for (;;) {
      const t = peek();
      if (!t) fail('Kurung tutup ")" hilang');
      if (t.t === ',' || t.t === ';' || t.t === ')') out.push({ type: 'empty' });
      else out.push(expr());
      const k = next();
      if (!k) fail('Kurung tutup ")" hilang');
      if (k.t === ',' || k.t === ';') continue;
      if (k.t === ')') break;
      fail(`Token tak terduga "${k.s}"`);
    }
    return out;
  }
  function primary() {
    const t = next();
    if (!t) fail('Rumus tidak lengkap');
    switch (t.t) {
      case 'num': return { type: 'num', v: t.v };
      case 'str': return { type: 'str', v: t.v };
      case 'err': return { type: 'err', v: t.v };
      case 'ref': return { type: 'ref', sheet: t.sheet, ...t.a };
      case 'id': {
        if (peek() && peek().t === '(') {
          next();
          const name = t.v.toUpperCase().replace(/^_XLFN\.(_XLWS\.)?|^_XLWS\./, '');
          return { type: 'call', name, args: args() };
        }
        const u = t.v.toUpperCase();
        if (u === 'TRUE') return { type: 'bool', v: true };
        if (u === 'FALSE') return { type: 'bool', v: false };
        return { type: 'name', name: t.v };
      }
      case '(': { const e = expr(); expect(')'); return { type: 'paren', a: e }; }
      case '{': {
        const rows = [[]];
        for (;;) {
          const k = peek();
          if (!k) fail('Kurung kurawal "}" hilang');
          if (k.t === '}') { next(); break; }
          if (k.t === ',') { next(); continue; }
          if (k.t === ';') { next(); rows.push([]); continue; }
          rows[rows.length - 1].push(expr());
        }
        return { type: 'arr', rows };
      }
      default: fail(`Token tak terduga "${t.s}"`);
    }
  }
  const tree = expr();
  if (pos < toks.length) fail(`Token tak terduga "${toks[pos].s}"`);
  return tree;
}

// ---- Reference text helpers ----
function cellText(r, c, ar, ac) { return (ac ? '$' : '') + colName(c) + (ar ? '$' : '') + (r + 1); }

export function refText(a, sheet) {
  const pre = sheet != null ? quoteSheet(sheet) + '!' : '';
  if (a.err) return pre + '#REF!';
  if (a.kind === 'col') return pre + (a.ac1 ? '$' : '') + colName(a.c1) + ':' + (a.ac2 ? '$' : '') + colName(a.c2);
  if (a.kind === 'row') return pre + (a.ar1 ? '$' : '') + (a.r1 + 1) + ':' + (a.ar2 ? '$' : '') + (a.r2 + 1);
  let s = pre + cellText(a.r1, a.c1, a.ar1, a.ac1);
  if (a.kind === 'range') s += ':' + (a.r2 === Infinity ? (a.ac2 ? '$' : '') + colName(a.c2) : cellText(a.r2, a.c2, a.ar2, a.ac2));
  if (a.spill) s += '#';
  return s;
}

// Rebuilds formula text, letting fn rewrite each reference token.
// fn(a, sheetName) returns a new `a` (or null to keep). a.err => #REF!
export function mapRefs(formula, fn) {
  const toks = lex(formula);
  let out = '', changed = false;
  for (const t of toks) {
    if (t.t === 'ref') {
      const na = fn({ ...t.a }, t.sheet);
      if (na) { out += refText(na, 'sheet' in na ? na.sheet : t.sheet); changed = true; continue; }
    }
    out += t.s;
  }
  return changed ? out : formula;
}

// Shifts relative references (copy/paste, fill).
export function shiftFormula(formula, dr, dc) {
  if (!dr && !dc) return formula;
  return mapRefs(formula, a => {
    if (a.kind !== 'col') { if (!a.ar1) a.r1 += dr; if (!a.ar2 && a.r2 !== Infinity) a.r2 += dr; }
    if (a.kind !== 'row') { if (!a.ac1) a.c1 += dc; if (!a.ac2 && a.c2 !== Infinity) a.c2 += dc; }
    if (a.r1 < 0 || a.c1 < 0 || a.r2 < 0 || a.c2 < 0 || a.c1 >= MAXC || (a.c2 !== Infinity && a.c2 >= MAXC)) a.err = true;
    return a;
  });
}

// Cycles $ anchoring for the reference at the caret (F4).
export function toggleAbsAt(text, caret) {
  const body = text.startsWith('=') ? text.slice(1) : text;
  const off = text.startsWith('=') ? 1 : 0;
  for (const t of lex(body)) {
    if (t.t !== 'ref') continue;
    const s = t.p + off, e = s + t.s.length;
    if (caret < s || caret > e) continue;
    const a = { ...t.a };
    const state = (a.ar1 ? 1 : 0) + (a.ac1 ? 2 : 0);
    const nextState = { 0: 3, 3: 1, 1: 2, 2: 0 }[state];
    a.ar1 = a.ar2 = !!(nextState & 1);
    a.ac1 = a.ac2 = !!(nextState & 2);
    if (a.kind === 'col') a.ar1 = a.ar2 = false;
    if (a.kind === 'row') a.ac1 = a.ac2 = false;
    const nt = refText(a, t.sheet);
    return { text: text.slice(0, s) + nt + text.slice(e), caret: s + nt.length };
  }
  return null;
}

// Closes unbalanced quotes/parentheses when a formula is committed (like Sheets/Excel).
export function autoClose(text) {
  if (!text.startsWith('=')) return text;
  let body = text.slice(1);
  const toks = lex(body);
  const last = toks[toks.length - 1];
  if (last && last.t === 'str' && last.open) body += '"';
  let depth = 0, brace = 0;
  for (const t of lex(body)) {
    if (t.t === '(') depth++;
    else if (t.t === ')') depth = Math.max(0, depth - 1);
    else if (t.t === '{') brace++;
    else if (t.t === '}') brace = Math.max(0, brace - 1);
  }
  return '=' + body + '}'.repeat(brace) + ')'.repeat(depth);
}
