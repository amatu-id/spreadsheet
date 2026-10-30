// Function library part 2: statistics, distributions, financial, engineering, database.
import { FErr, ERR, err, Ref, scalar, toArr, num, int, str, bool, opt, check, nums, flat, compare, criteria, vec, transpose } from './core.js';
import { F, def, S, grid, pairs2, fact, combin, serialNum } from './functions.js';

const sum = v => v.reduce((s, x) => s + x, 0);
const mean = v => { if (!v.length) throw ERR.DIV0; return sum(v) / v.length; };
const fixf = x => (Number.isInteger(x) ? x : +x.toPrecision(15));

// ---------- STATISTICS ----------
def('AVERAGE', args => fixf(mean(nums(args))), { min: 1, fmtArg: 0 });
def('AVERAGEA', args => fixf(mean(nums(args, { a: true }))), { min: 1, fmtArg: 0 });
def('COUNT', args => {
  let n = 0;
  for (const a of args) {
    if (a === undefined) continue;
    if (a instanceof Ref || Array.isArray(a)) n += flat([a]).filter(x => typeof x === 'number').length;
    else { try { num(a); if (!(a instanceof FErr)) n++; } catch { /* not a number */ } }
  }
  return n;
}, { errOk: true });
def('COUNTA', args => {
  let n = 0;
  for (const a of args) {
    if (a === undefined) continue;
    if (a instanceof Ref) a.forEach(x => { if (x != null) n++; });
    else if (Array.isArray(a)) n += a.flat().filter(x => x != null).length;
    else n++;
  }
  return n;
}, { errOk: true });
def('COUNTBLANK', ([r]) => { let n = 0; const g = grid(r); for (let i = 0; i < g.R; i++) for (let j = 0; j < g.C; j++) { const v = g.get(i, j); if (v == null || v === '') n++; } if (r instanceof Ref && r.open) n += (r.r2 - r.lastRow) * g.C; return n; }, { min: 1, max: 1 });
def('COUNTUNIQUE', args => new Set(flat(args).filter(v => v != null && v !== '').map(v => typeof v + ':' + (typeof v === 'string' ? v.toLowerCase() : v))).size, { min: 1 });
def('MAX', args => { const v = nums(args); return v.length ? Math.max(...v) : 0; }, { min: 1, fmtArg: 0 });
def('MIN', args => { const v = nums(args); return v.length ? Math.min(...v) : 0; }, { min: 1, fmtArg: 0 });
def('MAXA', args => { const v = nums(args, { a: true }); return v.length ? Math.max(...v) : 0; }, { min: 1 });
def('MINA', args => { const v = nums(args, { a: true }); return v.length ? Math.min(...v) : 0; }, { min: 1 });
function median(v) { if (!v.length) throw ERR.NUM; const s = v.slice().sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
def('MEDIAN', args => median(nums(args)), { min: 1, fmtArg: 0 });
function modes(v) {
  const cnt = new Map(); let best = 1;
  for (const x of v) { const c = (cnt.get(x) || 0) + 1; cnt.set(x, c); if (c > best) best = c; }
  if (best < 2) throw ERR.NA;
  const out = []; const seen = new Set();
  for (const x of v) if (cnt.get(x) === best && !seen.has(x)) { seen.add(x); out.push(x); }
  return out;
}
def('MODE MODE.SNGL', args => modes(nums(args))[0], { min: 1 });
def('MODE.MULT', args => modes(nums(args)).map(x => [x]), { min: 1 });
def('LARGE', (a, k) => { const v = nums([a]).sort((x, y) => y - x), i = Math.ceil(num(k)); if (i < 1 || i > v.length) throw ERR.NUM; return v[i - 1]; }, { scalar: [1], min: 2, max: 2, fmtArg: 0 });
def('SMALL', (a, k) => { const v = nums([a]).sort((x, y) => x - y), i = Math.ceil(num(k)); if (i < 1 || i > v.length) throw ERR.NUM; return v[i - 1]; }, { scalar: [1], min: 2, max: 2, fmtArg: 0 });
function rank(x, ref, ord, avg) {
  const v = nums([ref]), n = num(x), asc = ord !== undefined && num(ord) !== 0;
  if (!v.includes(n)) throw ERR.NA;
  const better = v.filter(y => (asc ? y < n : y > n)).length;
  if (!avg) return better + 1;
  const ties = v.filter(y => y === n).length;
  return better + (ties + 1) / 2;
}
def('RANK RANK.EQ', (x, r, o) => rank(x, r, o, false), { scalar: [0], min: 2, max: 3 });
def('RANK.AVG', (x, r, o) => rank(x, r, o, true), { scalar: [0], min: 2, max: 3 });
function pctInc(v, k) { if (!v.length || k < 0 || k > 1) throw ERR.NUM; const s = v.slice().sort((a, b) => a - b); const h = (s.length - 1) * k, lo = Math.floor(h); return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]); }
function pctExc(v, k) { const s = v.slice().sort((a, b) => a - b), n = s.length; const h = (n + 1) * k - 1; if (h < 0 || h > n - 1) throw ERR.NUM; const lo = Math.floor(h); return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]); }
def('PERCENTILE PERCENTILE.INC', ([a, k]) => pctInc(nums([a]), num(k)), { min: 2, max: 2, fmtArg: 0 });
def('PERCENTILE.EXC', ([a, k]) => pctExc(nums([a]), num(k)), { min: 2, max: 2, fmtArg: 0 });
def('QUARTILE QUARTILE.INC', ([a, q]) => { const k = int(q); if (k < 0 || k > 4) throw ERR.NUM; return pctInc(nums([a]), k / 4); }, { min: 2, max: 2, fmtArg: 0 });
def('QUARTILE.EXC', ([a, q]) => { const k = int(q); if (k < 1 || k > 3) throw ERR.NUM; return pctExc(nums([a]), k / 4); }, { min: 2, max: 2, fmtArg: 0 });
function pctRank(v, x, sig, exc) {
  const s = v.slice().sort((a, b) => a - b), n = s.length;
  if (!n || x < s[0] || x > s[n - 1]) throw ERR.NA;
  let i = s.findIndex(y => y >= x);
  let r;
  if (s[i] === x) { const lower = s.filter(y => y < x).length; r = exc ? (lower + 1) / (n + 1) : n === 1 ? 1 : lower / (n - 1); }
  else { const lo = s[i - 1], hi = s[i]; const f = (x - lo) / (hi - lo); r = exc ? (i + f) / (n + 1) : (i - 1 + f) / (n - 1); }
  const p = Math.pow(10, sig);
  return Math.floor(r * p + 1e-9) / p;
}
def('PERCENTRANK PERCENTRANK.INC', ([a, x, s]) => pctRank(nums([a]), num(x), int(opt(s, 3)), false), { min: 2, max: 3 });
def('PERCENTRANK.EXC', ([a, x, s]) => pctRank(nums([a]), num(x), int(opt(s, 3)), true), { min: 2, max: 3 });
function variance(v, sample) { const n = v.length; if (n < (sample ? 2 : 1)) throw ERR.DIV0; const m = mean(v); return sum(v.map(x => (x - m) ** 2)) / (sample ? n - 1 : n); }
def('VAR VAR.S', args => variance(nums(args), true), { min: 1 });
def('VARP VAR.P', args => variance(nums(args), false), { min: 1 });
def('VARA', args => variance(nums(args, { a: true }), true), { min: 1 });
def('VARPA', args => variance(nums(args, { a: true }), false), { min: 1 });
def('STDEV STDEV.S', args => Math.sqrt(variance(nums(args), true)), { min: 1, fmtArg: 0 });
def('STDEVP STDEV.P', args => Math.sqrt(variance(nums(args), false)), { min: 1, fmtArg: 0 });
def('STDEVA', args => Math.sqrt(variance(nums(args, { a: true }), true)), { min: 1 });
def('STDEVPA', args => Math.sqrt(variance(nums(args, { a: true }), false)), { min: 1 });
def('AVEDEV', args => { const v = nums(args), m = mean(v); return mean(v.map(x => Math.abs(x - m))); }, { min: 1 });
def('DEVSQ', args => { const v = nums(args), m = mean(v); return sum(v.map(x => (x - m) ** 2)); }, { min: 1 });
def('GEOMEAN', args => { const v = nums(args); if (!v.length || v.some(x => x <= 0)) throw ERR.NUM; return Math.exp(mean(v.map(Math.log))); }, { min: 1 });
def('HARMEAN', args => { const v = nums(args); if (!v.length || v.some(x => x <= 0)) throw ERR.NUM; return v.length / sum(v.map(x => 1 / x)); }, { min: 1 });
def('TRIMMEAN', ([a, p]) => { const v = nums([a]).sort((x, y) => x - y), pc = num(p); if (pc < 0 || pc >= 1) throw ERR.NUM; const k = Math.floor(v.length * pc / 2); return mean(v.slice(k, v.length - k)); }, { min: 2, max: 2 });
def('KURT', args => { const v = nums(args), n = v.length; if (n < 4) throw ERR.DIV0; const m = mean(v), s = Math.sqrt(variance(v, true)); const k = sum(v.map(x => ((x - m) / s) ** 4)); return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * k - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3)); }, { min: 1 });
def('SKEW', args => { const v = nums(args), n = v.length; if (n < 3) throw ERR.DIV0; const m = mean(v), s = Math.sqrt(variance(v, true)); return n / ((n - 1) * (n - 2)) * sum(v.map(x => ((x - m) / s) ** 3)); }, { min: 1 });
def('SKEW.P', args => { const v = nums(args), n = v.length; if (n < 1) throw ERR.DIV0; const m = mean(v), s = Math.sqrt(variance(v, false)); return sum(v.map(x => ((x - m) / s) ** 3)) / n; }, { min: 1 });
S('STANDARDIZE', (x, m, s) => { const sd = num(s); if (sd <= 0) throw ERR.NUM; return (num(x) - num(m)) / sd; });
function linreg(ys, xs) {
  const p = pairs2(xs, ys);
  if (p.length < 2) throw ERR.DIV0;
  const mx = mean(p.map(q => q[0])), my = mean(p.map(q => q[1]));
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of p) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  if (!sxx) throw ERR.DIV0;
  const b = sxy / sxx;
  return { b, a: my - b * mx, sxy, sxx, syy, n: p.length, p };
}
def('SLOPE', ([y, x]) => linreg(y, x).b, { min: 2, max: 2 });
def('INTERCEPT', ([y, x]) => linreg(y, x).a, { min: 2, max: 2 });
def('RSQ', ([y, x]) => { const r = linreg(y, x); if (!r.syy) throw ERR.DIV0; return r.sxy ** 2 / (r.sxx * r.syy); }, { min: 2, max: 2 });
def('CORREL PEARSON', ([a, b]) => { const r = linreg(b, a); if (!r.syy) throw ERR.DIV0; return r.sxy / Math.sqrt(r.sxx * r.syy); }, { min: 2, max: 2 });
def('COVAR COVARIANCE.P', ([a, b]) => { const p = pairs2(a, b); const mx = mean(p.map(q => q[0])), my = mean(p.map(q => q[1])); return sum(p.map(([x, y]) => (x - mx) * (y - my))) / p.length; }, { min: 2, max: 2 });
def('COVARIANCE.S', ([a, b]) => { const p = pairs2(a, b); if (p.length < 2) throw ERR.DIV0; const mx = mean(p.map(q => q[0])), my = mean(p.map(q => q[1])); return sum(p.map(([x, y]) => (x - mx) * (y - my))) / (p.length - 1); }, { min: 2, max: 2 });
def('STEYX', ([y, x]) => { const r = linreg(y, x); if (r.n < 3) throw ERR.DIV0; return Math.sqrt((r.syy - r.sxy ** 2 / r.sxx) / (r.n - 2)); }, { min: 2, max: 2 });
def('FORECAST FORECAST.LINEAR', (x, y, xs) => { const r = linreg(y, xs); return r.a + r.b * num(x); }, { scalar: [0], min: 3, max: 3 });
function knownXs(ys, xs) { return xs === undefined ? vec(ys).map((_, i) => [i + 1]) : xs; }
def('TREND', ([ys, xs, nx, cst]) => {
  const X = knownXs(ys, xs), r = linreg(ys, X);
  let a = r.a, b = r.b;
  if (cst !== undefined && !bool(cst)) { b = sum(r.p.map(([x, y]) => x * y)) / sum(r.p.map(([x]) => x * x)); a = 0; }
  const target = nx === undefined ? toArr(X) : toArr(nx);
  return target.map(row => row.map(v => a + b * num(v)));
}, { min: 1, max: 4 });
def('GROWTH', ([ys, xs, nx]) => {
  const Y = toArr(ys).map(r => r.map(v => { if (typeof v !== 'number' || v <= 0) throw ERR.NUM; return Math.log(v); }));
  const X = knownXs(ys, xs), r = linreg(Y, X);
  const target = nx === undefined ? toArr(X) : toArr(nx);
  return target.map(row => row.map(v => Math.exp(r.a + r.b * num(v))));
}, { min: 1, max: 3 });
def('LINEST', ([ys, xs]) => { const r = linreg(ys, knownXs(ys, xs)); return [[r.b, r.a]]; }, { min: 1, max: 4 });
def('LOGEST', ([ys, xs]) => { const Y = toArr(ys).map(r => r.map(v => Math.log(num(v)))); const r = linreg(Y, knownXs(ys, xs)); return [[Math.exp(r.b), Math.exp(r.a)]]; }, { min: 1, max: 4 });
def('FREQUENCY', ([d, b]) => {
  const data = nums([d]), bins = nums([b]).sort((x, y) => x - y);
  const out = Array(bins.length + 1).fill(0);
  for (const x of data) { let i = bins.findIndex(v => x <= v); if (i < 0) i = bins.length; out[i]++; }
  return out.map(x => [x]);
}, { min: 2, max: 2 });

// distributions
export function erf(x) {
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const y = 1 - t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? y : -y;
}
const normCdf = z => 0.5 * (1 + erf(z / Math.SQRT2));
const normPdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
function normInv(p) {
  if (p <= 0 || p >= 1) throw ERR.NUM;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let q, r, x;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else if (p <= 1 - pl) { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  // one Newton refinement
  const e = normCdf(x) - p; const u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
  return x - u / (1 + x * u / 2);
}
export function gammaln(x) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const c of g) ser += c / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}
function gammaFn(x) {
  if (x === Math.floor(x)) { if (x <= 0) throw ERR.NUM; return fact(x - 1); }
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gammaFn(1 - x));
  return Math.exp(gammaln(x));
}
function betacf(a, b, x) {
  const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function ibeta(x, a, b) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
}
function igamma(a, x) { // regularized lower incomplete gamma P(a,x)
  if (x <= 0) return 0;
  if (x < a + 1) { let sum = 1 / a, del = sum, ap = a; for (let n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; } return sum * Math.exp(-x + a * Math.log(x) - gammaln(a)); }
  let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - gammaln(a)) * h;
}
const tCdf = (t, df) => { const x = df / (df + t * t); const p = 0.5 * ibeta(x, df / 2, 0.5); return t > 0 ? 1 - p : p; };
const tPdf = (t, df) => Math.exp(gammaln((df + 1) / 2) - gammaln(df / 2)) / Math.sqrt(df * Math.PI) * Math.pow(1 + t * t / df, -(df + 1) / 2);
function invert(f, p, lo, hi) { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) < p) lo = m; else hi = m; if (hi - lo < 1e-12) break; } return (lo + hi) / 2; }
const chiCdf = (x, k) => igamma(k / 2, x / 2);

S('NORM.DIST NORMDIST', (x, m, s, c) => { const sd = num(s); if (sd <= 0) throw ERR.NUM; const z = (num(x) - num(m)) / sd; return bool(c) ? normCdf(z) : normPdf(z) / sd; });
S('NORM.INV NORMINV', (p, m, s) => { const sd = num(s); if (sd <= 0) throw ERR.NUM; return num(m) + sd * normInv(num(p)); });
S('NORM.S.DIST', (z, c) => (bool(c) ? normCdf(num(z)) : normPdf(num(z))));
S('NORMSDIST', z => normCdf(num(z)));
S('NORM.S.INV NORMSINV', p => normInv(num(p)));
S('PHI', x => normPdf(num(x)));
S('GAUSS', x => normCdf(num(x)) - 0.5);
S('LOGNORM.DIST', (x, m, s, c) => { const v = num(x), sd = num(s); if (v <= 0 || sd <= 0) throw ERR.NUM; const z = (Math.log(v) - num(m)) / sd; return bool(c) ? normCdf(z) : normPdf(z) / (v * sd); });
S('LOGNORMDIST', (x, m, s) => { const v = num(x), sd = num(s); if (v <= 0 || sd <= 0) throw ERR.NUM; return normCdf((Math.log(v) - num(m)) / sd); });
S('LOGNORM.INV LOGINV', (p, m, s) => Math.exp(num(m) + num(s) * normInv(num(p))));
S('EXPON.DIST EXPONDIST', (x, l, c) => { const v = num(x), lam = num(l); if (v < 0 || lam <= 0) throw ERR.NUM; return bool(c) ? 1 - Math.exp(-lam * v) : lam * Math.exp(-lam * v); });
S('POISSON.DIST POISSON', (x, m, c) => {
  const k = Math.floor(num(x)), mu = num(m); if (k < 0 || mu < 0) throw ERR.NUM;
  const pmf = i => Math.exp(-mu + i * Math.log(mu || 1e-300) - gammaln(i + 1));
  if (!bool(c)) return k === 0 ? Math.exp(-mu) : pmf(k);
  let s = 0; for (let i = 0; i <= k; i++) s += i === 0 ? Math.exp(-mu) : pmf(i); return Math.min(1, s);
});
S('BINOM.DIST BINOMDIST', (x, n, p, c) => {
  const k = Math.floor(num(x)), N = Math.floor(num(n)), pr = num(p);
  if (k < 0 || k > N || pr < 0 || pr > 1) throw ERR.NUM;
  const pmf = i => combin(N, i) * Math.pow(pr, i) * Math.pow(1 - pr, N - i);
  if (!bool(c)) return pmf(k);
  let s = 0; for (let i = 0; i <= k; i++) s += pmf(i); return Math.min(1, s);
});
S('NEGBINOM.DIST', (f, s, p, c) => {
  const k = Math.floor(num(f)), r = Math.floor(num(s)), pr = num(p);
  const pmf = i => combin(i + r - 1, i) * Math.pow(pr, r) * Math.pow(1 - pr, i);
  if (!bool(c)) return pmf(k); let t = 0; for (let i = 0; i <= k; i++) t += pmf(i); return t;
});
S('T.DIST', (x, d, c) => { const df = num(d); if (df < 1) throw ERR.NUM; return bool(c) ? tCdf(num(x), df) : tPdf(num(x), df); });
S('T.DIST.2T', (x, d) => { const v = num(x), df = num(d); if (v < 0 || df < 1) throw ERR.NUM; return 2 * (1 - tCdf(v, df)); });
S('T.DIST.RT', (x, d) => 1 - tCdf(num(x), num(d)));
S('TDIST', (x, d, t) => { const v = num(x), df = num(d), tails = int(t); if (v < 0) throw ERR.NUM; return tails * (1 - tCdf(v, df)); });
S('T.INV', (p, d) => { const pr = num(p), df = num(d); if (pr <= 0 || pr >= 1) throw ERR.NUM; return invert(t => tCdf(t, df), pr, -1e3, 1e3); });
S('T.INV.2T TINV', (p, d) => { const pr = num(p), df = num(d); if (pr <= 0 || pr > 1) throw ERR.NUM; return invert(t => tCdf(t, df), 1 - pr / 2, 0, 1e3); });
S('CHISQ.DIST', (x, k, c) => { const v = num(x), df = num(k); if (v < 0 || df < 1) throw ERR.NUM; return bool(c) ? chiCdf(v, df) : Math.exp((df / 2 - 1) * Math.log(v) - v / 2 - (df / 2) * Math.log(2) - gammaln(df / 2)); });
S('CHISQ.DIST.RT CHIDIST', (x, k) => 1 - chiCdf(num(x), num(k)));
S('CHISQ.INV', (p, k) => invert(x => chiCdf(x, num(k)), num(p), 0, 1e4));
S('CHISQ.INV.RT CHIINV', (p, k) => invert(x => chiCdf(x, num(k)), 1 - num(p), 0, 1e4));
S('F.DIST', (x, a, b, c) => { const v = num(x), d1 = num(a), d2 = num(b); const cdf = ibeta(d1 * v / (d1 * v + d2), d1 / 2, d2 / 2); if (bool(c)) return cdf; const h = 1e-6 * Math.max(1, v); return (ibeta(d1 * (v + h) / (d1 * (v + h) + d2), d1 / 2, d2 / 2) - ibeta(d1 * Math.max(0, v - h) / (d1 * Math.max(0, v - h) + d2), d1 / 2, d2 / 2)) / (2 * h); });
S('F.DIST.RT FDIST', (x, a, b) => { const v = num(x), d1 = num(a), d2 = num(b); return 1 - ibeta(d1 * v / (d1 * v + d2), d1 / 2, d2 / 2); });
S('GAMMA', x => check(gammaFn(num(x))));
S('GAMMALN GAMMALN.PRECISE', x => { const v = num(x); if (v <= 0) throw ERR.NUM; return gammaln(v); });
S('GAMMA.DIST GAMMADIST', (x, a, b, c) => { const v = num(x), al = num(a), be = num(b); if (v < 0 || al <= 0 || be <= 0) throw ERR.NUM; return bool(c) ? igamma(al, v / be) : Math.exp((al - 1) * Math.log(v) - v / be - gammaln(al) - al * Math.log(be)); });
S('BETA.DIST BETADIST', (x, a, b, c, lo, hi) => { const A = num(opt(lo, 0)), B = num(opt(hi, 1)); const v = (num(x) - A) / (B - A); return c === undefined || bool(c) ? ibeta(v, num(a), num(b)) : Math.exp((num(a) - 1) * Math.log(v) + (num(b) - 1) * Math.log(1 - v) - (gammaln(num(a)) + gammaln(num(b)) - gammaln(num(a) + num(b)))) / (B - A); });
S('WEIBULL.DIST WEIBULL', (x, a, b, c) => { const v = num(x), k = num(a), l = num(b); if (v < 0 || k <= 0 || l <= 0) throw ERR.NUM; return bool(c) ? 1 - Math.exp(-((v / l) ** k)) : (k / l) * (v / l) ** (k - 1) * Math.exp(-((v / l) ** k)); });
S('CONFIDENCE CONFIDENCE.NORM', (a, s, n) => { const al = num(a), sd = num(s), N = num(n); if (al <= 0 || al >= 1 || sd <= 0 || N < 1) throw ERR.NUM; return normInv(1 - al / 2) * sd / Math.sqrt(N); });
S('CONFIDENCE.T', (a, s, n) => { const al = num(a), sd = num(s), N = num(n); if (N < 2) throw ERR.DIV0; return invert(t => tCdf(t, N - 1), 1 - al / 2, 0, 1e3) * sd / Math.sqrt(N); });
def('Z.TEST ZTEST', ([a, x, s]) => { const v = nums([a]); const sd = s === undefined ? Math.sqrt(variance(v, true)) : num(s); return 1 - normCdf((mean(v) - num(x)) / (sd / Math.sqrt(v.length))); }, { min: 2, max: 3 });
def('T.TEST TTEST', ([a, b, t, ty]) => {
  const tails = int(t), type = int(ty);
  let tv, df;
  if (type === 1) { const p = pairs2(a, b).map(([x, y]) => x - y); const m = mean(p), sd = Math.sqrt(variance(p, true)); tv = m / (sd / Math.sqrt(p.length)); df = p.length - 1; }
  else {
    const x = nums([a]), y = nums([b]); const mx = mean(x), my = mean(y), vx = variance(x, true), vy = variance(y, true);
    if (type === 2) { df = x.length + y.length - 2; const sp = ((x.length - 1) * vx + (y.length - 1) * vy) / df; tv = (mx - my) / Math.sqrt(sp * (1 / x.length + 1 / y.length)); }
    else { const sx = vx / x.length, sy = vy / y.length; tv = (mx - my) / Math.sqrt(sx + sy); df = (sx + sy) ** 2 / (sx * sx / (x.length - 1) + sy * sy / (y.length - 1)); }
  }
  return tails * (1 - tCdf(Math.abs(tv), df));
}, { min: 4, max: 4 });
S('FISHER', x => { const v = num(x); if (v <= -1 || v >= 1) throw ERR.NUM; return 0.5 * Math.log((1 + v) / (1 - v)); });
S('FISHERINV', y => { const e = Math.exp(2 * num(y)); return (e - 1) / (e + 1); });
S('ERF ERF.PRECISE', (a, b) => (b === undefined ? erf(num(a)) : erf(num(b)) - erf(num(a))));
S('ERFC ERFC.PRECISE', x => 1 - erf(num(x)));

// ---------- FINANCIAL ----------
function pmt(r, n, pv, fv = 0, t = 0) {
  if (!n) throw ERR.NUM;
  if (r === 0) return -(pv + fv) / n;
  const f = Math.pow(1 + r, n);
  return -(r * (fv + pv * f)) / ((1 + r * t) * (f - 1));
}
function fv(r, n, p, pv = 0, t = 0) {
  if (r === 0) return -(pv + p * n);
  const f = Math.pow(1 + r, n);
  return -(pv * f + p * (1 + r * t) * (f - 1) / r);
}
function pv(r, n, p, fvv = 0, t = 0) {
  if (r === 0) return -(fvv + p * n);
  const f = Math.pow(1 + r, n);
  return -(fvv + p * (1 + r * t) * (f - 1) / r) / f;
}
function ipmt(r, per, n, pvv, fvv = 0, t = 0) {
  if (per < 1 || per > n) throw ERR.NUM;
  const p = pmt(r, n, pvv, fvv, t);
  let i;
  if (per === 1) i = t === 1 ? 0 : -pvv;
  else i = t === 1 ? fv(r, per - 2, p, pvv, 1) - p : fv(r, per - 1, p, pvv, 0);
  return i * r;
}
const fin = { fmt: 'cur' };
S('PMT', (r, n, p, f, t) => pmt(num(r), num(n), num(p), num(opt(f, 0)), num(opt(t, 0))), fin);
S('FV', (r, n, p, v, t) => fv(num(r), num(n), num(p), num(opt(v, 0)), num(opt(t, 0))), fin);
S('PV', (r, n, p, f, t) => pv(num(r), num(n), num(p), num(opt(f, 0)), num(opt(t, 0))), fin);
S('IPMT', (r, per, n, p, f, t) => ipmt(num(r), num(per), num(n), num(p), num(opt(f, 0)), num(opt(t, 0))), fin);
S('PPMT', (r, per, n, p, f, t) => { const a = [num(r), num(n), num(p), num(opt(f, 0)), num(opt(t, 0))]; return pmt(...a) - ipmt(a[0], num(per), a[1], a[2], a[3], a[4]); }, fin);
S('ISPMT', (r, per, n, p) => num(p) * num(r) * (num(per) / num(n) - 1), fin);
S('NPER', (r, p, v, f, t) => {
  const R = num(r), P = num(p), V = num(v), Fv = num(opt(f, 0)), T = num(opt(t, 0));
  if (R === 0) { if (!P) throw ERR.NUM; return -(V + Fv) / P; }
  const x = (P * (1 + R * T) - Fv * R) / (P * (1 + R * T) + V * R);
  if (x <= 0) throw ERR.NUM;
  return Math.log(x) / Math.log(1 + R);
});
S('RATE', (n, p, v, f, t, g) => {
  const N = num(n), P = num(p), V = num(v), Fv = num(opt(f, 0)), T = num(opt(t, 0));
  let r = num(opt(g, 0.1));
  for (let i = 0; i < 100; i++) {
    const y = r === 0 ? V + P * N + Fv : V * Math.pow(1 + r, N) + P * (1 + r * T) * (Math.pow(1 + r, N) - 1) / r + Fv;
    const h = 1e-7, r2 = r + h;
    const y2 = V * Math.pow(1 + r2, N) + P * (1 + r2 * T) * (Math.pow(1 + r2, N) - 1) / r2 + Fv;
    const d = (y2 - y) / h;
    if (!d) break;
    const nr = r - y / d;
    if (Math.abs(nr - r) < 1e-10) return nr;
    r = nr;
  }
  throw ERR.NUM;
}, { fmt: '0.00%' });
S('CUMIPMT', (r, n, v, s, e, t) => { const R = num(r), N = num(n), V = num(v), T = num(t); let x = 0; for (let k = int(s); k <= int(e); k++) x += ipmt(R, k, N, V, 0, T); return x; }, fin);
S('CUMPRINC', (r, n, v, s, e, t) => { const R = num(r), N = num(n), V = num(v), T = num(t); const P = pmt(R, N, V, 0, T); let x = 0; for (let k = int(s); k <= int(e); k++) x += P - ipmt(R, k, N, V, 0, T); return x; }, fin);
def('NPV', ([r, ...vals]) => { const R = num(r); return nums(vals).reduce((s, v, i) => s + v / Math.pow(1 + R, i + 1), 0); }, { min: 2, fmt: 'cur' });
function irr(vals, guess) {
  let r = guess;
  for (let i = 0; i < 200; i++) {
    let f = 0, d = 0;
    vals.forEach((v, k) => { f += v / Math.pow(1 + r, k); d -= k * v / Math.pow(1 + r, k + 1); });
    if (!d) break;
    const nr = r - f / d;
    if (Math.abs(nr - r) < 1e-10) return nr;
    r = nr;
  }
  throw ERR.NUM;
}
def('IRR', ([v, g]) => irr(nums([v]), num(opt(g, 0.1))), { min: 1, max: 2, fmt: '0.00%' });
def('MIRR', ([v, fr, rr]) => {
  const vals = nums([v]), n = vals.length, f = num(fr), r = num(rr);
  let npvNeg = 0, fvPos = 0;
  vals.forEach((x, i) => { if (x < 0) npvNeg += x / Math.pow(1 + f, i); else fvPos += x * Math.pow(1 + r, n - 1 - i); });
  if (!npvNeg || !fvPos) throw ERR.DIV0;
  return Math.pow(-fvPos / npvNeg, 1 / (n - 1)) - 1;
}, { min: 3, max: 3, fmt: '0.00%' });
def('XNPV', ([r, v, d]) => { const R = num(r), vals = nums([v]), ds = nums([d]); if (vals.length !== ds.length) throw ERR.NUM; return vals.reduce((s, x, i) => s + x / Math.pow(1 + R, (ds[i] - ds[0]) / 365), 0); }, { min: 3, max: 3, fmt: 'cur' });
def('XIRR', ([v, d, g]) => {
  const vals = nums([v]), ds = nums([d]); let r = num(opt(g, 0.1));
  for (let i = 0; i < 200; i++) {
    let f = 0, df = 0;
    vals.forEach((x, k) => { const t = (ds[k] - ds[0]) / 365; f += x / Math.pow(1 + r, t); df -= t * x / Math.pow(1 + r, t + 1); });
    const nr = r - f / df;
    if (Math.abs(nr - r) < 1e-10) return nr;
    r = nr;
  }
  throw ERR.NUM;
}, { min: 2, max: 3, fmt: '0.00%' });
S('SLN', (c, s, l) => { const L = num(l); if (!L) throw ERR.DIV0; return (num(c) - num(s)) / L; }, fin);
S('SYD', (c, s, l, p) => { const L = num(l), P = num(p); if (P < 1 || P > L) throw ERR.NUM; return (num(c) - num(s)) * (L - P + 1) * 2 / (L * (L + 1)); }, fin);
S('DB', (c, s, l, p, m) => {
  const C = num(c), Sv = num(s), Lf = num(l), P = int(p), M = int(opt(m, 12));
  if (C < 0 || Sv < 0 || Lf <= 0 || P < 1 || P > Lf + 1) throw ERR.NUM;
  const rate = rndTo(1 - Math.pow(Sv / C, 1 / Lf), 3);
  let total = 0, dep = 0;
  for (let i = 1; i <= P; i++) {
    if (i === 1) dep = C * rate * M / 12;
    else if (i === Lf + 1) dep = (C - total) * rate * (12 - M) / 12;
    else dep = (C - total) * rate;
    total += dep;
  }
  return dep;
}, fin);
const rndTo = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
S('DDB', (c, s, l, p, f) => {
  const C = num(c), Sv = num(s), Lf = num(l), P = num(p), Fc = num(opt(f, 2));
  if (P < 1 || P > Lf) throw ERR.NUM;
  let book = C, dep = 0;
  for (let i = 1; i <= P; i++) { dep = Math.min(book * Fc / Lf, Math.max(0, book - Sv)); book -= dep; }
  return dep;
}, fin);
S('EFFECT', (n, k) => { const r = num(n), N = Math.floor(num(k)); if (r <= 0 || N < 1) throw ERR.NUM; return Math.pow(1 + r / N, N) - 1; }, { fmt: '0.00%' });
S('NOMINAL', (e, k) => { const r = num(e), N = Math.floor(num(k)); if (r <= 0 || N < 1) throw ERR.NUM; return N * (Math.pow(1 + r, 1 / N) - 1); }, { fmt: '0.00%' });
def('FVSCHEDULE', ([p, s]) => nums([s]).reduce((v, r) => v * (1 + r), num(p)), { min: 2, max: 2 });
S('PDURATION', (r, p, f) => { const R = num(r), P = num(p), Fv = num(f); if (R <= 0 || P <= 0 || Fv <= 0) throw ERR.NUM; return (Math.log(Fv) - Math.log(P)) / Math.log(1 + R); });
S('RRI', (n, p, f) => { const N = num(n), P = num(p), Fv = num(f); if (N <= 0 || !P) throw ERR.NUM; return Math.pow(Fv / P, 1 / N) - 1; }, { fmt: '0.00%' });
S('DOLLARDE', (d, f) => { const v = num(d), fr = Math.floor(num(f)); if (fr < 1) throw ERR.DIV0; const i = Math.trunc(v); return i + (v - i) * Math.pow(10, Math.ceil(Math.log10(fr))) / fr; });
S('DOLLARFR', (d, f) => { const v = num(d), fr = Math.floor(num(f)); if (fr < 1) throw ERR.DIV0; const i = Math.trunc(v); return i + (v - i) * fr / Math.pow(10, Math.ceil(Math.log10(fr))); });

// ---------- ENGINEERING ----------
function fromBase(s, radix, bits) {
  const t = str(s).trim().toUpperCase();
  if (!t) return 0;
  if (t.length > 10 || !new RegExp('^[' + '0123456789ABCDEF'.slice(0, radix) + ']+$').test(t)) throw ERR.NUM;
  let v = parseInt(t, radix);
  if (t.length === 10 && v >= Math.pow(radix, 10) / 2) v -= Math.pow(radix, 10);
  return v;
}
function toBase(n, radix, places, min, max) {
  const v = Math.trunc(num(n));
  if (v < min || v > max) throw ERR.NUM;
  let s = v < 0 ? (Math.pow(radix, 10) + v).toString(radix) : v.toString(radix);
  s = s.toUpperCase();
  if (places !== undefined && v >= 0) { const p = int(places); if (p < s.length) throw ERR.NUM; s = s.padStart(p, '0'); }
  return s;
}
const LIM = { 2: [-512, 511], 8: [-536870912, 536870911], 16: [-549755813888, 549755813887] };
for (const [a, ra] of [['BIN', 2], ['OCT', 8], ['DEC', 10], ['HEX', 16]]) {
  for (const [b, rb] of [['BIN', 2], ['OCT', 8], ['DEC', 10], ['HEX', 16]]) {
    if (a === b) continue;
    S(`${a}2${b}`, (x, p) => {
      const v = ra === 10 ? Math.trunc(num(x)) : fromBase(x, ra);
      if (rb === 10) return v;
      return toBase(v, rb, p, LIM[rb][0], LIM[rb][1]);
    });
  }
}
S('BITAND', (a, b) => Number(BigInt(int(a)) & BigInt(int(b))));
S('BITOR', (a, b) => Number(BigInt(int(a)) | BigInt(int(b))));
S('BITXOR', (a, b) => Number(BigInt(int(a)) ^ BigInt(int(b))));
S('BITLSHIFT', (a, s) => { const k = int(s); return k >= 0 ? Number(BigInt(int(a)) << BigInt(k)) : Number(BigInt(int(a)) >> BigInt(-k)); });
S('BITRSHIFT', (a, s) => { const k = int(s); return k >= 0 ? Number(BigInt(int(a)) >> BigInt(k)) : Number(BigInt(int(a)) << BigInt(-k)); });
S('DELTA', (a, b) => (num(a) === num(opt(b, 0)) ? 1 : 0));
S('GESTEP', (n, s) => (num(n) >= num(opt(s, 0)) ? 1 : 0));
const UNITS = {
  m: ['len', 1], km: ['len', 1000], cm: ['len', 0.01], mm: ['len', 0.001], mi: ['len', 1609.344], ft: ['len', 0.3048], in: ['len', 0.0254], yd: ['len', 0.9144], Nmi: ['len', 1852],
  g: ['mass', 1], kg: ['mass', 1000], mg: ['mass', 0.001], lbm: ['mass', 453.59237], ozm: ['mass', 28.349523125], ton: ['mass', 907184.74], t: ['mass', 1e6],
  s: ['time', 1], sec: ['time', 1], mn: ['time', 60], min: ['time', 60], hr: ['time', 3600], day: ['time', 86400], d: ['time', 86400], yr: ['time', 31557600], wk: ['time', 604800],
  l: ['vol', 0.001], L: ['vol', 0.001], ml: ['vol', 1e-6], mL: ['vol', 1e-6], m3: ['vol', 1], gal: ['vol', 0.003785411784], qt: ['vol', 0.000946352946], pt: ['vol', 0.000473176473], cup: ['vol', 0.0002365882365], tbs: ['vol', 1.47867648e-5], tsp: ['vol', 4.92892159375e-6],
  m2: ['area', 1], km2: ['area', 1e6], ha: ['area', 10000], ft2: ['area', 0.09290304], in2: ['area', 0.00064516], ac: ['area', 4046.8564224], mi2: ['area', 2589988.110336],
  'm/s': ['spd', 1], 'km/h': ['spd', 1 / 3.6], kph: ['spd', 1 / 3.6], mph: ['spd', 0.44704], kn: ['spd', 0.514444444],
  J: ['en', 1], kJ: ['en', 1000], cal: ['en', 4.184], kcal: ['en', 4184], Wh: ['en', 3600], kWh: ['en', 3.6e6], BTU: ['en', 1055.05585262],
  W: ['pow', 1], kW: ['pow', 1000], HP: ['pow', 745.69987158227], h: ['pow', 745.69987158227],
  Pa: ['pr', 1], kPa: ['pr', 1000], bar: ['pr', 1e5], atm: ['pr', 101325], psi: ['pr', 6894.757293168], mmHg: ['pr', 133.322387415],
  byte: ['info', 8], bit: ['info', 1], kB: ['info', 8000], MB: ['info', 8e6], GB: ['info', 8e9],
};
S('CONVERT', (n, f, t) => {
  const v = num(n), a = str(f), b = str(t);
  const temp = { C: x => x, F: x => (x - 32) * 5 / 9, K: x => x - 273.15, cel: x => x, fah: x => (x - 32) * 5 / 9, kel: x => x - 273.15 };
  const tempOut = { C: x => x, F: x => x * 9 / 5 + 32, K: x => x + 273.15, cel: x => x, fah: x => x * 9 / 5 + 32, kel: x => x + 273.15 };
  if (temp[a] && tempOut[b]) return fixf(tempOut[b](temp[a](v)));
  const ua = UNITS[a], ub = UNITS[b];
  if (!ua || !ub || ua[0] !== ub[0]) throw ERR.NA;
  return fixf(v * ua[1] / ub[1]);
});

// ---------- DATABASE ----------
function dbFilter(db, field, crit) {
  const D = toArr(db), C = toArr(crit);
  const head = D[0].map(h => str(h).toLowerCase());
  let col = -1;
  if (field !== undefined) {
    const f = scalar(field);
    col = typeof f === 'number' ? f - 1 : head.indexOf(str(f).toLowerCase());
    if (col < 0 || col >= head.length) throw ERR.VALUE;
  }
  const ch = C[0].map(h => str(h).toLowerCase());
  const rows = C.slice(1).map(r => r.map((v, j) => (v == null || v === '' ? null : [head.indexOf(ch[j]), criteria(v)])).filter(Boolean));
  const out = [];
  for (const r of D.slice(1)) {
    const ok = !rows.length || rows.some(conds => conds.every(([j, p]) => j >= 0 && p(r[j])));
    if (ok) out.push(col >= 0 ? r[col] : r);
  }
  return out;
}
const dnum = l => l.filter(v => typeof v === 'number');
def('DSUM', ([d, f, c]) => sum(dnum(dbFilter(d, f, c))), { min: 3, max: 3 });
def('DAVERAGE', ([d, f, c]) => mean(dnum(dbFilter(d, f, c))), { min: 3, max: 3 });
def('DCOUNT', ([d, f, c]) => dnum(dbFilter(d, f, c)).length, { min: 2, max: 3 });
def('DCOUNTA', ([d, f, c]) => dbFilter(d, f, c).filter(v => v != null && v !== '').length, { min: 2, max: 3 });
def('DMAX', ([d, f, c]) => { const v = dnum(dbFilter(d, f, c)); return v.length ? Math.max(...v) : 0; }, { min: 3, max: 3 });
def('DMIN', ([d, f, c]) => { const v = dnum(dbFilter(d, f, c)); return v.length ? Math.min(...v) : 0; }, { min: 3, max: 3 });
def('DPRODUCT', ([d, f, c]) => dnum(dbFilter(d, f, c)).reduce((p, x) => p * x, 1), { min: 3, max: 3 });
def('DGET', ([d, f, c]) => { const v = dbFilter(d, f, c); if (!v.length) throw ERR.VALUE; if (v.length > 1) throw ERR.NUM; return v[0]; }, { min: 3, max: 3 });
def('DSTDEV', ([d, f, c]) => Math.sqrt(variance(dnum(dbFilter(d, f, c)), true)), { min: 3, max: 3 });
def('DSTDEVP', ([d, f, c]) => Math.sqrt(variance(dnum(dbFilter(d, f, c)), false)), { min: 3, max: 3 });
def('DVAR', ([d, f, c]) => variance(dnum(dbFilter(d, f, c)), true), { min: 3, max: 3 });
def('DVARP', ([d, f, c]) => variance(dnum(dbFilter(d, f, c)), false), { min: 3, max: 3 });

// ---------- QUERY (Google Sheets subset) ----------
def('QUERY', ([data, q, h]) => {
  const D = toArr(data);
  const c0 = data instanceof Ref ? data.c1 : 0;
  const text = q === undefined ? 'select *' : str(q);
  let headers = h === undefined ? (D.length > 1 && D[0].every(v => typeof v === 'string') && D[1].some(v => typeof v !== 'string') ? 1 : 0) : int(h);
  const head = headers ? D[0].map(v => str(v)) : D[0].map((_, j) => '');
  let rows = D.slice(headers);
  const colOf = tok => {
    const t = tok.trim();
    let m = /^Col(\d+)$/i.exec(t); if (m) return +m[1] - 1;
    m = /^`?([A-Z]{1,3})`?$/.exec(t); if (m) { let n = 0; for (const ch of m[1]) n = n * 26 + ch.charCodeAt(0) - 64; if (n - 1 - c0 < 0) throw err('#VALUE!', `Kolom ${t} di luar rentang QUERY`); return n - 1 - c0; }
    throw err('#VALUE!', `Kolom QUERY tidak dikenal: ${t}`);
  };
  const lower = text.replace(/\s+/g, ' ').trim();
  const kw = ['select', 'where', 'group by', 'pivot', 'order by', 'limit', 'offset', 'label', 'format', 'options'];
  const parts = {};
  const re = new RegExp('\\b(' + kw.join('|') + ')\\b', 'gi');
  const idx = [];
  let mm; while ((mm = re.exec(lower))) idx.push([mm.index, mm[1].toLowerCase()]);
  idx.forEach(([i, k], n) => { parts[k] = lower.slice(i + k.length, n + 1 < idx.length ? idx[n + 1][0] : lower.length).trim(); });
  const evalAtom = (expr, row) => {
    const t = expr.trim();
    if (/^'.*'$|^".*"$/.test(t)) return t.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(t)) return +t;
    if (/^(true|false)$/i.test(t)) return /^true$/i.test(t);
    if (/^date\s+'(.+)'$/i.test(t)) { const s = /'(.+)'/.exec(t)[1]; const [y, mo, d] = s.split('-').map(Number); return (Date.UTC(y, mo - 1, d) - Date.UTC(1899, 11, 30)) / 86400000; }
    return row[colOf(t)];
  };
  const evalCond = (c, row) => {
    const ors = c.split(/\s+or\s+/i);
    return ors.some(o => o.split(/\s+and\s+/i).every(a => {
      let s = a.trim(), neg = false;
      if (/^not\s+/i.test(s)) { neg = true; s = s.replace(/^not\s+/i, ''); }
      s = s.replace(/^\(|\)$/g, '');
      let m, r;
      if ((m = /^(.+?)\s+is\s+(not\s+)?null$/i.exec(s))) { const v = evalAtom(m[1], row); r = (v == null || v === '') !== !!m[2]; }
      else if ((m = /^(.+?)\s+(contains|starts with|ends with|matches|like)\s+(.+)$/i.exec(s))) {
        const v = str(evalAtom(m[1], row) ?? ''), p = str(evalAtom(m[3], row) ?? ''), op = m[2].toLowerCase();
        r = op === 'contains' ? v.includes(p) : op === 'starts with' ? v.startsWith(p) : op === 'ends with' ? v.endsWith(p) : op === 'matches' ? new RegExp('^' + p + '$').test(v) : new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$').test(v);
      } else if ((m = /^(.+?)\s*(<=|>=|!=|<>|=|<|>)\s*(.+)$/.exec(s))) {
        const x = evalAtom(m[1], row), y = evalAtom(m[3], row), c2 = compare(x, y);
        r = { '<=': c2 <= 0, '>=': c2 >= 0, '!=': c2 !== 0, '<>': c2 !== 0, '=': c2 === 0, '<': c2 < 0, '>': c2 > 0 }[m[2]];
        if (x == null) r = false;
      } else throw err('#VALUE!', 'Klausa WHERE QUERY tidak didukung');
      return neg ? !r : r;
    }));
  };
  if (parts.where) rows = rows.filter(r => evalCond(parts.where, r));
  const sel = (parts.select || '*').trim();
  const items = sel === '*' ? head.map((_, j) => ({ col: j, agg: null, raw: colNameQ(j + c0) })) : sel.split(',').map(s => {
    const t = s.trim(); const m = /^(sum|count|avg|max|min)\s*\(\s*(.+?)\s*\)$/i.exec(t);
    return m ? { col: colOf(m[2]), agg: m[1].toLowerCase(), raw: t } : { col: colOf(t), agg: null, raw: t };
  });
  const aggFn = (a, vals) => { const n = vals.filter(v => typeof v === 'number'); switch (a) { case 'sum': return sum(n); case 'count': return vals.filter(v => v != null && v !== '').length; case 'avg': return n.length ? sum(n) / n.length : null; case 'max': return n.length ? Math.max(...n) : null; case 'min': return n.length ? Math.min(...n) : null; } };
  let out;
  if (parts['group by'] || items.some(i => i.agg)) {
    const gcols = parts['group by'] ? parts['group by'].split(',').map(colOf) : [];
    const groups = new Map();
    for (const r of rows) { const k = gcols.map(c => str(r[c] ?? '')).join('\u0001'); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
    out = [...groups.values()].map(g => items.map(it => (it.agg ? aggFn(it.agg, g.map(r => r[it.col])) : g[0][it.col])));
    if (gcols.length) out.sort((a, b) => { for (let i = 0; i < items.length; i++) if (!items[i].agg) { const c = compare(a[i], b[i]); if (c) return c; } return 0; });
  } else out = rows.map(r => items.map(it => r[it.col]));
  if (parts['order by']) {
    const keys = parts['order by'].split(',').map(s => { const m = /^(.+?)(\s+(asc|desc))?$/i.exec(s.trim()); const raw = m[1].trim(); let i = items.findIndex(it => it.raw.toLowerCase() === raw.toLowerCase()); if (i < 0) i = items.findIndex(it => it.col === colOf(raw) && !it.agg); return [i, !m[3] || m[3].toLowerCase() === 'asc']; });
    out.sort((a, b) => { for (const [i, asc] of keys) { const c = compare(a[i], b[i]); if (c) return asc ? c : -c; } return 0; });
  }
  if (parts.offset) out = out.slice(int(+parts.offset));
  if (parts.limit) out = out.slice(0, int(+parts.limit));
  const labels = items.map(it => (it.agg ? `${it.agg} ${head[it.col] || colNameQ(it.col + c0)}` : head[it.col] || ''));
  if (parts.label) {
    for (const l of parts.label.split(',')) { const m = /^(.+?)\s+['"](.*)['"]$/.exec(l.trim()); if (!m) continue; const i = items.findIndex(it => it.raw.toLowerCase() === m[1].trim().toLowerCase()); if (i >= 0) labels[i] = m[2]; }
  }
  const showHead = labels.some(l => l !== '');
  const res = showHead ? [labels, ...out] : out;
  if (!res.length) throw err('#N/A', 'Hasil QUERY kosong');
  return res;
}, { min: 1, max: 3 });
function colNameQ(j) { let s = ''; j++; while (j > 0) { const m = (j - 1) % 26; s = String.fromCharCode(65 + m) + s; j = Math.floor((j - 1) / 26); } return s; }

export const FUNCTION_NAMES = () => Object.keys(F).sort();

// ---------- Indonesian helpers ----------
const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
function terbilang(n) {
  n = Math.floor(Math.abs(n));
  if (n < 12) return SATUAN[n];
  if (n < 20) return terbilang(n - 10) + ' belas';
  if (n < 100) return (terbilang(Math.floor(n / 10)) + ' puluh ' + terbilang(n % 10)).trim();
  if (n < 200) return ('seratus ' + terbilang(n - 100)).trim();
  if (n < 1000) return (terbilang(Math.floor(n / 100)) + ' ratus ' + terbilang(n % 100)).trim();
  if (n < 2000) return ('seribu ' + terbilang(n - 1000)).trim();
  const units = [[1e15, 'kuadriliun'], [1e12, 'triliun'], [1e9, 'miliar'], [1e6, 'juta'], [1e3, 'ribu']];
  for (const [u, w] of units) if (n >= u) return (terbilang(Math.floor(n / u)) + ' ' + w + ' ' + terbilang(n % u)).trim();
  return '';
}
S('TERBILANG', x => { const v = num(x); if (Math.abs(v) >= 1e18) throw ERR.NUM; const t = v === 0 ? 'nol' : terbilang(v); return (v < 0 ? 'minus ' : '') + t.replace(/\s+/g, ' '); });
