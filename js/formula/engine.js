// Formula evaluation, dynamic-array spilling and workbook recalculation.
import { parse } from './parse.js';
import { FErr, ERR, errOf, err, Ref, Lambda, unref, scalar, num, str, compare } from './core.js';
import { F } from './functions.js';
import './functions2.js';
import { key, keyR, keyC, MAXC, MAXR, addr } from '../util.js';
import { L, isDateFmt } from '../format.js';

class Defer { constructor(sh, r, c, cell) { this.sh = sh; this.r = r; this.c = c; this.cell = cell; } }

const NOTFOUND = Symbol('nf');
function envGet(env, name) {
  for (let e = env; e; e = e.parent) if (e.vars.has(name)) return e.vars.get(name);
  return NOTFOUND;
}

function scalarBin(op, a, b) {
  if (a instanceof FErr) return a;
  if (b instanceof FErr) return b;
  if (op === '&') return str(a) + str(b);
  if (op === '=' || op === '<>' || op === '<' || op === '>' || op === '<=' || op === '>=') {
    if (typeof a === 'object' && a !== null) return ERR.VALUE;
    if (typeof b === 'object' && b !== null) return ERR.VALUE;
    const c = compare(a, b);
    switch (op) {
      case '=': return c === 0; case '<>': return c !== 0; case '<': return c < 0;
      case '>': return c > 0; case '<=': return c <= 0; default: return c >= 0;
    }
  }
  let x, y;
  try { x = num(a); y = num(b); } catch (e) { if (e instanceof FErr) return e; throw e; }
  let r;
  switch (op) {
    case '+': r = x + y; break;
    case '-': r = x - y; break;
    case '*': r = x * y; break;
    case '/': if (y === 0) return ERR.DIV0; r = x / y; break;
    case '^': if (x === 0 && y === 0) return ERR.NUM; r = Math.pow(x, y); break;
    default: return ERR.VALUE;
  }
  if (!isFinite(r)) return ERR.NUM;
  if ((op === '+' || op === '-') && r !== 0 && !Number.isInteger(r)) r = +r.toPrecision(15);
  return r;
}

function pick(v, i, j) {
  const r = v.length === 1 ? 0 : i, c = v[0].length === 1 ? 0 : j;
  if (r >= v.length || c >= v[0].length) return ERR.NA;
  return v[r][c];
}

export function broadcast(a, b, fn) {
  const A = Array.isArray(a), B = Array.isArray(b);
  if (!A && !B) return fn(a, b);
  const R = Math.max(A ? a.length : 1, B ? b.length : 1);
  const C = Math.max(A ? a[0].length : 1, B ? b[0].length : 1);
  const out = [];
  for (let i = 0; i < R; i++) {
    const row = new Array(C);
    for (let j = 0; j < C; j++) row[j] = fn(A ? pick(a, i, j) : a, B ? pick(b, i, j) : b);
    out.push(row);
  }
  return out;
}

const mapVal = (v, fn) => (Array.isArray(v) ? v.map(row => row.map(fn)) : fn(v));

function lift(d, args) {
  const idx = d.scalar === true ? null : d.scalar;
  let R = 1, C = 1, any = false;
  const vals = args.map((a, i) => {
    if (idx && !idx.includes(i)) return a;
    const v = unref(a);
    if (Array.isArray(v)) { any = true; R = Math.max(R, v.length); C = Math.max(C, v[0].length); }
    return v;
  });
  const call = xs => {
    if (!d.errOk) for (const x of xs) if (x instanceof FErr) return x;
    try { return d.f(...xs); } catch (e) { if (e instanceof FErr) return e; throw e; }
  };
  if (!any) return call(vals);
  const out = [];
  for (let i = 0; i < R; i++) {
    const row = new Array(C);
    for (let j = 0; j < C; j++) {
      const xs = vals.map((v, k) => (Array.isArray(v) && (!idx || idx.includes(k)) ? pick(v, i, j) : v));
      let r = call(xs);
      if (r instanceof Ref) r = r.value();
      else if (Array.isArray(r)) r = r[0]?.[0] ?? null;
      row[j] = r;
    }
    out.push(row);
  }
  return out;
}

const normV = v => (v === undefined ? null : v instanceof Ref ? v.value() : v);

export class Engine {
  constructor(wb) {
    this.wb = wb;
    this.cid = 1;
    this.depth = 0;
    this.inCalc = false;
    this.ev = (n, ctx) => this.evalNode(n, ctx);
  }

  value(sh, r, c) {
    const k = r * MAXC + c;
    const cell = sh.cells.get(k);
    if (cell !== undefined) {
      if (cell.f != null) return this.calcCell(sh, r, c, cell);
      if (cell.v != null) return cell.v;
    }
    if (sh.spillMap.size || sh.spillPrev.size) {
      let s = sh.spillMap.get(k);
      if (s) return s.v;
      if (this.inCalc) {
        const p = sh.spillPrev.get(k);
        if (p) {
          const oc = sh.cells.get(p.o);
          if (oc && oc.f != null) this.calcCell(sh, keyR(p.o), keyC(p.o), oc);
          s = sh.spillMap.get(k);
          if (s) return s.v;
        }
      }
    }
    return null;
  }

  calcCell(sh, r, c, cell) {
    if (cell.cid === this.cid) return cell.sv;
    if (cell.busy) { cell.circ = true; return err('#REF!', 'Terdeteksi dependensi melingkar'); }
    if (this.inCalc && this.depth > 180) throw new Defer(sh, r, c, cell);
    cell.busy = true;
    this.depth++;
    let res;
    try {
      if (cell.ast === undefined) {
        try { cell.ast = parse(cell.f); cell.perr = null; } catch (e) { cell.ast = null; cell.perr = e.message; }
      }
      if (!cell.ast) res = err('#ERROR!', 'Kesalahan penguraian rumus' + (cell.perr ? ': ' + cell.perr : ''));
      else res = this.evalNode(cell.ast, { eng: this, sh, r, c, env: null, dr: 0, dc: 0 });
      if (res instanceof Ref) res = res.single ? res.value() : res.toArray();
    } catch (e) {
      if (e instanceof Defer) { cell.busy = false; this.depth--; throw e; }
      res = e instanceof FErr ? e : err('#ERROR!', String(e && e.message || e));
    }
    cell.busy = false;
    this.depth--;
    if (res instanceof Lambda) res = err('#CALC!', 'LAMBDA harus dipanggil dengan argumen');
    if (res === undefined) res = null;
    let sv;
    if (Array.isArray(res)) {
      if (!res.length || !res[0].length) sv = err('#CALC!', 'Array kosong');
      else if (res.length === 1 && res[0].length === 1) sv = normV(res[0][0]);
      else sv = this.spill(sh, r, c, res);
    } else sv = res;
    if (cell.circ) { sv = err('#REF!', 'Terdeteksi dependensi melingkar'); cell.circ = false; }
    cell.sv = sv;
    cell.val = res;
    cell.cid = this.cid;
    cell.af = typeof sv === 'number' && cell.ast ? this.inferFmt(cell.ast, sh, 0) : null;
    cell.hl = null;
    if (cell.ast && cell.ast.type === 'call' && cell.ast.name === 'HYPERLINK' && cell.ast.args[0]) {
      try { cell.hl = str(unref(this.evalNode(cell.ast.args[0], { eng: this, sh, r, c, env: null, dr: 0, dc: 0 }))); } catch { cell.hl = null; }
    }
    return sv;
  }

  spill(sh, r, c, arr) {
    const R = arr.length, C = arr[0].length, ok = key(r, c);
    if (r + R > MAXR || c + C > MAXC) return err('#SPILL!', 'Hasil array melewati batas sheet');
    for (let i = 0; i < R; i++) {
      for (let j = 0; j < C; j++) {
        if (!i && !j) continue;
        const k = key(r + i, c + j);
        const cl = sh.cells.get(k);
        if (cl && (cl.v != null || cl.f != null)) return err('#SPILL!', `Hasil array tidak diperluas karena akan menimpa data di ${addr(r + i, c + j)}`);
        const o = sh.spillMap.get(k);
        if (o && o.o !== ok) return err('#SPILL!', `Hasil array bertabrakan dengan array lain di ${addr(r + i, c + j)}`);
      }
    }
    for (let i = 0; i < R; i++) {
      for (let j = 0; j < C; j++) {
        if (!i && !j) continue;
        sh.spillMap.set(key(r + i, c + j), { o: ok, v: normV(arr[i][j]) });
      }
    }
    sh.spillOrigins.set(ok, { rows: R, cols: C });
    if (r + R > sh.rows) sh.growTo(r + R, sh.cols);
    if (c + C > sh.cols) sh.growTo(sh.rows, c + C);
    return normV(arr[0][0]);
  }

  recalc() {
    const t0 = performance.now();
    this.inCalc = true;
    try {
      for (let pass = 0; pass < 3; pass++) {
        this.cid++;
        for (const sh of this.wb.sheets) {
          sh.spillPrev = sh.spillMap;
          sh.spillMap = new Map();
          sh.spillOrigins = new Map();
        }
        for (const sh of this.wb.sheets) {
          const list = [];
          for (const [k, cell] of sh.cells) if (cell.f != null) list.push(k);
          list.sort((a, b) => a - b);
          for (const k of list) {
            const cell = sh.cells.get(k);
            if (cell && cell.cid !== this.cid) this.force(sh, keyR(k), keyC(k), cell);
          }
        }
        let changed = false;
        for (const sh of this.wb.sheets) {
          if (sh.spillMap.size !== sh.spillPrev.size) { changed = true; break; }
          for (const k of sh.spillMap.keys()) if (!sh.spillPrev.has(k)) { changed = true; break; }
          if (changed) break;
        }
        if (!changed) break;
      }
    } finally {
      this.inCalc = false;
      for (const sh of this.wb.sheets) sh.spillPrev = new Map();
    }
    this.lastMs = performance.now() - t0;
  }

  force(sh, r, c, cell) {
    const stack = [[sh, r, c, cell]];
    let guard = 0;
    while (stack.length) {
      const [s, rr, cc, cl] = stack[stack.length - 1];
      try {
        this.depth = 0;
        this.calcCell(s, rr, cc, cl);
        stack.pop();
      } catch (e) {
        if (!(e instanceof Defer)) throw e;
        stack.push([e.sh, e.r, e.c, e.cell]);
        if (++guard > 200000) { cl.sv = err('#REF!', 'Rantai rumus terlalu panjang'); cl.cid = this.cid; stack.pop(); }
      }
    }
  }

  // Evaluate a formula text in the context of a cell (CF rules, validation, goal seek).
  evalText(text, sh, r, c, dr = 0, dc = 0) {
    let ast;
    try { ast = parse(text.replace(/^=/, '')); } catch { return ERR.ERROR; }
    return this.evalAst(ast, sh, r, c, dr, dc);
  }

  evalAst(ast, sh, r, c, dr = 0, dc = 0) {
    try {
      return this.evalNode(ast, { eng: this, sh, r, c, env: null, dr, dc });
    } catch (e) {
      if (e instanceof FErr) return e;
      return ERR.ERROR;
    }
  }

  resolveRef(node, ctx) {
    let sh = ctx.sh;
    if (node.sheet != null) {
      sh = this.wb.sheetByName(node.sheet);
      if (!sh) return err('#REF!', `Sheet "${node.sheet}" tidak ditemukan`);
    }
    let { r1, c1, r2, c2 } = node;
    if (ctx.dr || ctx.dc) {
      if (node.kind !== 'col') { if (!node.ar1) r1 += ctx.dr; if (!node.ar2 && r2 !== Infinity) r2 += ctx.dr; }
      if (node.kind !== 'row') { if (!node.ac1) c1 += ctx.dc; if (!node.ac2 && c2 !== Infinity) c2 += ctx.dc; }
      if (r1 < 0 || c1 < 0 || r2 < 0 || c2 < 0) return ERR.REF;
    }
    if (node.spill) {
      const k = key(r1, c1);
      const cell = sh.cells.get(k);
      if (!cell || cell.f == null) return err('#REF!', 'Referensi # memerlukan sel yang meluap');
      this.calcCell(sh, r1, c1, cell);
      const so = sh.spillOrigins.get(k);
      if (!so) return Array.isArray(cell.val) ? ERR.REF : new Ref(sh, r1, c1, r1, c1);
      return new Ref(sh, r1, c1, r1 + so.rows - 1, c1 + so.cols - 1);
    }
    const open = r2 === Infinity || c2 === Infinity;
    if (r2 === Infinity) r2 = Math.max(sh.rows - 1, r1);
    if (c2 === Infinity) c2 = Math.max(sh.cols - 1, c1);
    if (r1 > r2) [r1, r2] = [r2, r1];
    if (c1 > c2) [c1, c2] = [c2, c1];
    return new Ref(sh, r1, c1, r2, c2, open);
  }

  evalNode(node, ctx) {
    switch (node.type) {
      case 'num': case 'str': case 'bool': return node.v;
      case 'err': return errOf(node.v);
      case 'empty': return undefined;
      case 'paren': return this.evalNode(node.a, ctx);
      case 'ref': return this.resolveRef(node, ctx);
      case 'name': return this.evalName(node, ctx);
      case 'call': return this.call(node, ctx);
      case 'neg': return mapVal(unref(this.evalNode(node.a, ctx)), x => scalarBin('-', 0, x));
      case 'pos': return this.evalNode(node.a, ctx);
      case 'pct': return mapVal(unref(this.evalNode(node.a, ctx)), x => scalarBin('/', x, 100));
      case 'isect': return scalar(this.evalNode(node.a, ctx));
      case 'bin': {
        const a = unref(this.evalNode(node.a, ctx));
        const b = unref(this.evalNode(node.b, ctx));
        return broadcast(a, b, (x, y) => scalarBin(node.op, x, y));
      }
      case 'rangeop': {
        const a = this.evalNode(node.a, ctx), b = this.evalNode(node.b, ctx);
        if (!(a instanceof Ref) || !(b instanceof Ref) || a.sheet !== b.sheet) return ERR.VALUE;
        return new Ref(a.sheet, Math.min(a.r1, b.r1), Math.min(a.c1, b.c1), Math.max(a.r2, b.r2), Math.max(a.c2, b.c2));
      }
      case 'arr': {
        const rows = node.rows.map(row => row.map(n => scalar(this.evalNode(n, ctx))));
        const w = rows[0].length;
        if (!w || rows.some(r => r.length !== w)) return err('#VALUE!', 'Konstanta array tidak persegi');
        return rows;
      }
      case 'invoke': {
        const fn = this.evalNode(node.fn, ctx);
        if (!(fn instanceof Lambda)) return fn instanceof FErr ? fn : ERR.VALUE;
        return this.apply(fn, node.args.map(a => this.evalNode(a, ctx)));
      }
      default: return ERR.ERROR;
    }
  }

  evalName(node, ctx) {
    const u = node.name.toUpperCase();
    if (ctx.env) { const v = envGet(ctx.env, u); if (v !== NOTFOUND) return v; }
    const nm = this.wb.names.get(u);
    if (nm) {
      if (nm.busy) return err('#REF!', 'Nama melingkar');
      if (nm.ast === undefined) { try { nm.ast = parse(String(nm.ref).replace(/^=/, '')); } catch { nm.ast = null; } }
      if (!nm.ast) return ERR.NAME;
      nm.busy = true;
      try { return this.evalNode(nm.ast, { ...ctx, env: null, dr: 0, dc: 0 }); } finally { nm.busy = false; }
    }
    return err('#NAME?', `Nama tidak dikenal: ${node.name}`);
  }

  call(node, ctx) {
    const name = node.name;
    if (ctx.env) {
      const v = envGet(ctx.env, name);
      if (v instanceof Lambda) return this.apply(v, node.args.map(a => this.evalNode(a, ctx)));
    }
    const d = F[name];
    if (!d) {
      const nm = this.wb.names.get(name);
      if (nm) {
        const v = this.evalName({ name }, ctx);
        if (v instanceof Lambda) return this.apply(v, node.args.map(a => this.evalNode(a, ctx)));
      }
      return err('#NAME?', `Fungsi tidak dikenal: ${name}`);
    }
    const n = node.args.length === 1 && node.args[0].type === 'empty' && d.max === 0 ? 0 : node.args.length;
    if ((d.min !== undefined && n < d.min) || (d.max !== undefined && n > d.max)) {
      return err('#N/A', `Jumlah argumen salah untuk ${name}`);
    }
    try {
      if (d.lazy) return d.f(node.args, ctx);
      const args = new Array(n);
      for (let i = 0; i < n; i++) args[i] = node.args[i].type === 'empty' ? undefined : this.evalNode(node.args[i], ctx);
      if (d.scalar) return lift(d, args);
      if (!d.errOk) for (const a of args) if (a instanceof FErr && !d.rawErr) return a;
      return d.f(args, ctx);
    } catch (e) {
      if (e instanceof FErr) return e;
      if (e instanceof Defer) throw e;
      if (e instanceof RangeError) return err('#NUM!', 'Perhitungan terlalu dalam');
      console.error(name, e);
      return err('#ERROR!', String(e.message || e));
    }
  }

  apply(lam, vals) {
    if (vals.length > lam.params.length) return err('#VALUE!', 'Argumen LAMBDA terlalu banyak');
    const vars = new Map();
    lam.params.forEach((p, i) => vars.set(p, vals[i]));
    return this.evalNode(lam.body, { ...lam.ctx, env: { vars, parent: lam.env } });
  }

  inferFmt(node, sh, depth) {
    if (!node || depth > 5) return null;
    switch (node.type) {
      case 'paren': case 'pos': case 'neg': return this.inferFmt(node.a, sh, depth + 1);
      case 'ref': {
        if (node.kind === 'col' || node.kind === 'row') return null;
        const s = node.sheet != null ? this.wb.sheetByName(node.sheet) : sh;
        const cell = s && s.cells.get(key(node.r1, node.c1));
        if (!cell) return null;
        return this.wb.styles[cell.s]?.fmt || cell.af || null;
      }
      case 'call': {
        const d = F[node.name];
        if (!d) return null;
        if (d.fmt) {
          if (d.fmt === 'date') return L.date;
          if (d.fmt === 'datetime') return L.date + ' hh:mm:ss';
          if (d.fmt === 'time') return 'hh:mm:ss';
          if (d.fmt === 'cur') return '"' + L.cur + '"#,##0.00';
          return d.fmt;
        }
        if (d.fmtArg !== undefined && node.args[d.fmtArg]) return this.inferFmt(node.args[d.fmtArg], sh, depth + 1);
        return null;
      }
      case 'bin': {
        if (!'+-*/'.includes(node.op)) return null;
        const fa = this.inferFmt(node.a, sh, depth + 1), fb = this.inferFmt(node.b, sh, depth + 1);
        const da = fa && isDateFmt(fa), db = fb && isDateFmt(fb);
        if (node.op === '-' && da && db) return null;
        if (node.op === '*' || node.op === '/') { if (da || db) return null; return fa && !/%/.test(fa) ? fa : fb && !/%/.test(fb) ? fb : (fa || fb); }
        return da ? fa : db ? fb : fa || fb;
      }
      default: return null;
    }
  }
}
