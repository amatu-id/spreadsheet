// Value model shared by the evaluator and the function library.
import { parseNumber, parseDate, general } from '../format.js';

export class FErr {
  constructor(code, msg) { this.code = code; this.msg = msg; }
  toString() { return this.code; }
}

export const ERR = {
  NULL: new FErr('#NULL!'), DIV0: new FErr('#DIV/0!', 'Pembagian dengan nol'), VALUE: new FErr('#VALUE!'),
  REF: new FErr('#REF!', 'Referensi tidak valid'), NAME: new FErr('#NAME?'), NUM: new FErr('#NUM!'),
  NA: new FErr('#N/A'), SPILL: new FErr('#SPILL!'), CALC: new FErr('#CALC!'), ERROR: new FErr('#ERROR!'),
};
const BY_CODE = Object.fromEntries(Object.values(ERR).map(e => [e.code, e]));
export const errOf = code => BY_CODE[code] || ERR.ERROR;
export const err = (code, msg) => new FErr(code, msg);
export const isErr = v => v instanceof FErr;

// A rectangular reference into a sheet. r2/c2 already clamped to sheet size.
export class Ref {
  constructor(sheet, r1, c1, r2, c2, open = false) {
    this.sheet = sheet; this.r1 = r1; this.c1 = c1; this.r2 = r2; this.c2 = c2; this.open = open;
  }
  get rows() { return this.r2 - this.r1 + 1; }
  get cols() { return this.c2 - this.c1 + 1; }
  get single() { return this.r1 === this.r2 && this.c1 === this.c2; }
  value(dr = 0, dc = 0) { return this.sheet.wb.eng.value(this.sheet, this.r1 + dr, this.c1 + dc); }
  // effective last row used for iteration (whole-column refs stop at data end)
  get lastRow() { return this.open ? Math.min(this.r2, Math.max(this.r1, this.sheet.dataRows() - 1)) : this.r2; }
  get lastCol() { return this.open ? Math.min(this.c2, Math.max(this.c1, this.sheet.dataCols() - 1)) : this.c2; }
  toArray() {
    const eng = this.sheet.wb.eng, out = [];
    const R = this.lastRow, C = this.lastCol;
    for (let r = this.r1; r <= R; r++) {
      const row = new Array(C - this.c1 + 1);
      for (let c = this.c1; c <= C; c++) row[c - this.c1] = eng.value(this.sheet, r, c);
      out.push(row);
    }
    return out;
  }
  forEach(fn) {
    const eng = this.sheet.wb.eng;
    const R = this.lastRow, C = this.lastCol;
    for (let r = this.r1; r <= R; r++) for (let c = this.c1; c <= C; c++) fn(eng.value(this.sheet, r, c), r, c);
  }
  sub(r1, c1, r2, c2) { return new Ref(this.sheet, this.r1 + r1, this.c1 + c1, this.r1 + r2, this.c1 + c2); }
}

export class Lambda {
  constructor(params, body, env, ctx) { this.params = params; this.body = body; this.env = env; this.ctx = ctx; }
}

export const isArr = v => Array.isArray(v);

// Dereference: Ref -> scalar (1x1) or 2D array; arrays of 1x1 -> scalar.
export function unref(v) {
  if (v instanceof Ref) return v.single ? v.value() : v.toArray();
  if (Array.isArray(v) && v.length === 1 && v[0].length === 1) return v[0][0];
  return v;
}

// Scalar view: top-left of a range/array.
export function scalar(v) {
  if (v instanceof Ref) return v.value();
  if (Array.isArray(v)) return v.length ? v[0][0] : null;
  return v;
}

export function toArr(v) {
  if (v instanceof Ref) return v.toArray();
  if (Array.isArray(v)) return v;
  return [[v === undefined ? null : v]];
}

export function parseNumStr(s) {
  const t = s.trim();
  if (!t) return null;
  const n = parseNumber(t);
  if (n) return n.v;
  const d = parseDate(t);
  if (d) return d.v;
  if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return parseFloat(t);
  return null;
}

export function num(v) {
  v = scalar(v);
  if (typeof v === 'number') return v;
  if (v == null) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof FErr) throw v;
  if (typeof v === 'string') {
    const n = parseNumStr(v);
    if (n === null) throw err('#VALUE!', `"${v.length > 30 ? v.slice(0, 30) + '…' : v}" bukan angka`);
    return n;
  }
  throw ERR.VALUE;
}

export function int(v) { return Math.trunc(num(v)); }

export function str(v) {
  v = scalar(v);
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return general(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (v instanceof FErr) throw v;
  return String(v);
}

export function bool(v) {
  v = scalar(v);
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (v == null) return false;
  if (v instanceof FErr) throw v;
  if (typeof v === 'string') {
    const u = v.toUpperCase();
    if (u === 'TRUE') return true;
    if (u === 'FALSE') return false;
    throw ERR.VALUE;
  }
  return !!v;
}

export const opt = (v, d) => (v === undefined ? d : v);
export function check(x) { if (typeof x !== 'number' || !isFinite(x)) throw ERR.NUM; return x; }

// Numbers for aggregate functions (SUM-like): range text/bools ignored, direct args coerced.
export function nums(args, { a = false } = {}) {
  const out = [];
  for (const v of args) {
    if (v === undefined) continue;
    if (v instanceof Ref || Array.isArray(v)) {
      const each = x => {
        if (typeof x === 'number') out.push(x);
        else if (x instanceof FErr) throw x;
        else if (a) { if (typeof x === 'boolean') out.push(x ? 1 : 0); else if (typeof x === 'string') out.push(0); }
      };
      if (v instanceof Ref) v.forEach(each); else for (const row of v) for (const x of row) each(x);
    } else if (v instanceof FErr) throw v;
    else if (v == null) out.push(0);
    else out.push(num(v));
  }
  return out;
}

// Iterate every value (including blanks) of args.
export function flat(args, keepBlank = false) {
  const out = [];
  for (const v of args) {
    if (v === undefined) continue;
    if (v instanceof Ref) v.forEach(x => { if (keepBlank || x != null) out.push(x); });
    else if (Array.isArray(v)) { for (const row of v) for (const x of row) if (keepBlank || x != null) out.push(x); }
    else out.push(v);
  }
  return out;
}

const TYPE_RANK = v => (typeof v === 'number' ? 1 : typeof v === 'string' ? 2 : typeof v === 'boolean' ? 3 : 0);

// Excel comparison: numbers < text < booleans; text case-insensitive. Blank adapts to the other side.
export function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
  if (b == null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  const ta = TYPE_RANK(a), tb = TYPE_RANK(b);
  if (ta !== tb) return ta < tb ? -1 : 1;
  if (ta === 2) {
    const x = a.toLowerCase(), y = b.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  if (ta === 3) return a === b ? 0 : a ? 1 : -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function wildcardRe(pattern, whole = true) {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '~' && i + 1 < pattern.length) { re += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); continue; }
    if (ch === '*') re += '[\\s\\S]*';
    else if (ch === '?') re += '[\\s\\S]';
    else re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(whole ? '^' + re + '$' : re, 'i');
}

// Criteria for COUNTIF/SUMIF/... → predicate
export function criteria(c) {
  c = scalar(c);
  if (typeof c === 'number') return v => (typeof v === 'number' ? v === c : typeof v === 'string' && parseNumStr(v) === c);
  if (typeof c === 'boolean') return v => v === c;
  if (c == null) return v => v == null || v === '';
  if (c instanceof FErr) return v => v instanceof FErr && v.code === c.code;
  let s = String(c), op = '=';
  const m = /^(<=|>=|<>|<|>|=)/.exec(s);
  if (m) { op = m[1]; s = s.slice(op.length); }
  const n = s.trim() === '' ? null : parseNumStr(s);
  const up = s.toUpperCase();
  if (op === '=' || op === '<>') {
    let p;
    if (s === '') p = v => v == null || v === '';
    else if (n !== null) p = v => (typeof v === 'number' ? Math.abs(v - n) < 1e-12 : typeof v === 'string' && parseNumStr(v) === n);
    else if (up === 'TRUE' || up === 'FALSE') p = v => v === (up === 'TRUE');
    else if (/[*?~]/.test(s)) { const re = wildcardRe(s); p = v => typeof v === 'string' && re.test(v); }
    else { const lo = s.toLowerCase(); p = v => typeof v === 'string' && v.toLowerCase() === lo; }
    return op === '=' ? p : v => !p(v);
  }
  const cmpOk = r => (op === '<' ? r < 0 : op === '>' ? r > 0 : op === '<=' ? r <= 0 : r >= 0);
  if (n !== null) return v => typeof v === 'number' && cmpOk(v - n);
  return v => typeof v === 'string' && cmpOk(compare(v, s));
}

export function dims(v) {
  if (v instanceof Ref) return [v.rows, v.cols];
  if (Array.isArray(v)) return [v.length, v[0]?.length || 0];
  return [1, 1];
}

export function mapArr(a, fn) { return a.map((row, i) => row.map((x, j) => fn(x, i, j))); }

export function transpose(a) {
  const R = a.length, C = a[0]?.length || 0, out = [];
  for (let j = 0; j < C; j++) { const row = new Array(R); for (let i = 0; i < R; i++) row[i] = a[i][j]; out.push(row); }
  return out;
}

// 1-D list of values from a row or column vector
export function vec(v) {
  const a = toArr(v);
  if (a.length === 1) return a[0].slice();
  return a.map(r => r[0]);
}
