// Starter templates.
import { newWorkbook, setInput } from './model.js';
import { parseRange, uid, serial, jsDateToSerial } from './util.js';

function make(name, fn) {
  const wb = newWorkbook(name);
  wb.hist.paused++;
  fn(wb, wb.sheets[0]);
  wb.hist.paused--;
  wb.dirty = false;
  return wb;
}
function at(a) { const g = parseRange(a); return [g.r1, g.c1]; }
function tall(sh, r, st) {
  if (st && st.fs > 11) sh.rowH.set(r, Math.max(sh.rowH.get(r) || 21, Math.ceil(st.fs * 4 / 3 * 1.3 + 8)));
}
function put(wb, sh, a, v, st) {
  const [r, c] = at(a);
  tall(sh, r, st);
  if (v !== null && v !== undefined) setInput(wb, sh, r, c, String(v));
  if (st) sh.setStyle(r, c, { ...sh.styleOf(r, c), ...st });
}
function row(wb, sh, a, vals, st) {
  const [r, c] = at(a);
  tall(sh, r, st);
  vals.forEach((v, j) => { if (v !== null && v !== undefined) setInput(wb, sh, r, c + j, String(v)); if (st) sh.setStyle(r, c + j, { ...sh.styleOf(r, c + j), ...st }); });
}
function styleRange(sh, a, st) {
  const g = parseRange(a);
  for (let r = g.r1; r <= g.r2; r++) for (let c = g.c1; c <= g.c2; c++) sh.setStyle(r, c, { ...sh.styleOf(r, c), ...st });
}
const widths = (sh, list) => list.forEach((w, i) => w && sh.colW.set(i, w));
const RP = '"Rp"#,##0';
const today = () => Math.floor(jsDateToSerial(new Date()));
const H = { b: true, color: '#ffffff', bg: '#1f6f54', va: 'middle' };
const thin = { w: 1, style: 'solid', color: '#d0d7de' };

function budget() {
  return make('Anggaran Bulanan', (wb, sh) => {
    sh.name = 'Anggaran';
    widths(sh, [200, 130, 130, 130, 120, 30]);
    put(wb, sh, 'A1', 'Anggaran Bulanan', { b: true, fs: 18, color: '#1f6f54' });
    put(wb, sh, 'A2', '=TEXT(TODAY(),"mmmm yyyy")', { color: '#5f6368' });
    row(wb, sh, 'A4', ['Kategori', 'Anggaran', 'Aktual', 'Selisih', '% Terpakai'], H);
    styleRange(sh, 'B4:E4', { ha: 'right' });
    const data = [['Rumah & sewa', 3500000, 3500000], ['Makan & belanja', 2500000, 2730000], ['Transportasi', 900000, 760000], ['Listrik & air', 650000, 702000], ['Internet & pulsa', 400000, 400000], ['Kesehatan', 500000, 150000], ['Hiburan', 600000, 845000], ['Tabungan & investasi', 2000000, 2000000]];
    data.forEach((d, i) => {
      const r = 5 + i;
      row(wb, sh, 'A' + r, [d[0], d[1], d[2], `=B${r}-C${r}`, `=IFERROR(C${r}/B${r},0)`]);
      styleRange(sh, `B${r}:D${r}`, { fmt: RP });
      put(wb, sh, 'E' + r, null, { fmt: '0%' });
    });
    row(wb, sh, 'A13', ['Total', '=SUM(B5:B12)', '=SUM(C5:C12)', '=B13-C13', '=IFERROR(C13/B13,0)'], { b: true, bt: { w: 2, style: 'solid', color: '#1f6f54' } });
    styleRange(sh, 'B13:D13', { fmt: RP }); put(wb, sh, 'E13', null, { fmt: '0%' });
    put(wb, sh, 'A16', 'Ringkasan', { b: true, fs: 12 });
    row(wb, sh, 'A17', ['Pemasukan bulan ini', 12500000]); put(wb, sh, 'B17', null, { fmt: RP });
    row(wb, sh, 'A18', ['Total pengeluaran', '=C13']); put(wb, sh, 'B18', null, { fmt: RP });
    row(wb, sh, 'A19', ['Sisa dana', '=B17-B18'], { b: true }); put(wb, sh, 'B19', null, { fmt: RP });
    row(wb, sh, 'A20', ['Rasio tabungan', '=C12/B17']); put(wb, sh, 'B20', null, { fmt: '0.0%' });
    styleRange(sh, 'A17:B20', { bb: thin });
    sh.banding.push({ r1: 3, c1: 0, r2: 11, c2: 4, h: '#1f6f54', a: '#ffffff', b: '#eef6f2', header: true });
    sh.cf.push({ id: uid('cf'), ranges: [{ r1: 4, c1: 4, r2: 11, c2: 4 }], type: 'bar', bar: { color: '#34a853' } });
    sh.cf.push({ id: uid('cf'), ranges: [{ r1: 4, c1: 3, r2: 12, c2: 3 }], type: 'num', op: 'lt', v1: '0', style: { color: '#c5221f', b: true } });
    sh.charts.push({ id: uid('ch'), type: 'column', range: 'A4:C12', anchor: { r: 3, c: 6 }, dx: 0, dy: 0, w: 520, h: 320, opts: { title: 'Anggaran vs Aktual', legend: 'bottom', headers: 'on', labels: 'on', colors: ['#9ad0b5', '#1f6f54'] } });
    sh.freezeR = 0;
  });
}

function todo() {
  return make('Daftar Tugas', (wb, sh) => {
    sh.name = 'Tugas';
    widths(sh, [70, 300, 150, 110, 130, 110, 240]);
    row(wb, sh, 'A1', ['Selesai', 'Tugas', 'Penanggung jawab', 'Prioritas', 'Status', 'Tenggat', 'Catatan'], { b: true, bg: '#f1f3f4', bb: { w: 2, style: 'solid', color: '#5f6368' }, va: 'middle' });
    sh.rowH.set(0, 30);
    const t = today();
    const tasks = [
      [true, 'Susun rencana kerja kuartal IV', 'Rina', 'Tinggi', 'Selesai', t - 6, ''],
      [false, 'Presentasi hasil survei pelanggan', 'Budi', 'Tinggi', 'Dikerjakan', t + 2, 'Draf di folder tim'],
      [false, 'Perbarui daftar harga pemasok', 'Sari', 'Sedang', 'Dikerjakan', t + 5, ''],
      [false, 'Rapat koordinasi mingguan', 'Andi', 'Sedang', 'Belum mulai', t + 1, 'Ruang rapat 2'],
      [false, 'Audit stok gudang', 'Dewi', 'Tinggi', 'Belum mulai', t - 1, 'Terlambat'],
      [true, 'Kirim laporan bulanan', 'Rina', 'Rendah', 'Selesai', t - 3, ''],
      [false, 'Evaluasi kampanye media sosial', 'Budi', 'Rendah', 'Belum mulai', t + 10, ''],
      [false, 'Siapkan materi pelatihan', 'Sari', 'Sedang', 'Dikerjakan', t + 7, ''],
    ];
    tasks.forEach((x, i) => {
      const r = i + 1;
      sh.put(r, 0, { v: x[0] });
      [1, 2, 3, 4].forEach(c => setInput(wb, sh, r, c, x[c]));
      sh.put(r, 5, { v: x[5] });
      if (x[6]) setInput(wb, sh, r, 6, x[6]);
    });
    for (let r = tasks.length + 1; r < 30; r++) sh.put(r, 0, { v: false });
    styleRange(sh, 'F2:F30', { fmt: 'd mmm yyyy' });
    sh.dv.push({ id: uid('dv'), type: 'checkbox', ranges: [{ r1: 1, c1: 0, r2: 29, c2: 0 }] });
    sh.dv.push({ id: uid('dv'), type: 'list', ranges: [{ r1: 1, c1: 3, r2: 29, c2: 3 }], items: ['Tinggi', 'Sedang', 'Rendah'], colors: ['#fad2cf', '#fce8b2', '#ceead6'], chip: 'chip', strict: true });
    sh.dv.push({ id: uid('dv'), type: 'list', ranges: [{ r1: 1, c1: 4, r2: 29, c2: 4 }], items: ['Belum mulai', 'Dikerjakan', 'Selesai'], colors: ['#e8eaed', '#c6dafc', '#ceead6'], chip: 'chip', strict: true });
    sh.cf.push({ id: uid('cf'), ranges: [{ r1: 1, c1: 1, r2: 29, c2: 6 }], type: 'formula', v1: '=$A2=TRUE', style: { s: true, color: '#9aa0a6' } });
    sh.cf.push({ id: uid('cf'), ranges: [{ r1: 1, c1: 5, r2: 29, c2: 5 }], type: 'formula', v1: '=AND($F2<TODAY(),$A2=FALSE,$F2<>"")', style: { color: '#c5221f', b: true } });
    sh.freezeR = 1;
    sh.filter = { r1: 0, c1: 0, r2: 29, c2: 6, crit: {} };
    styleRange(sh, 'A1:G1', { ha: 'left' });
  });
}

function invoice() {
  return make('Faktur', (wb, sh) => {
    sh.name = 'Faktur';
    sh.grid = false;
    widths(sh, [40, 60, 300, 80, 130, 150, 40]);
    put(wb, sh, 'B2', 'FAKTUR', { b: true, fs: 24, color: '#174ea6' });
    put(wb, sh, 'B3', 'PT Contoh Nusantara', { b: true });
    put(wb, sh, 'B4', 'Jl. Merdeka No. 10, Jakarta 10110', { color: '#5f6368' });
    put(wb, sh, 'B5', 'finance@contoh.co.id · (021) 555-0100', { color: '#5f6368' });
    row(wb, sh, 'E2', ['No. faktur', 'INV-2026-0142'], { ha: 'right' }); put(wb, sh, 'E2', null, { color: '#5f6368' });
    row(wb, sh, 'E3', ['Tanggal', '=TODAY()'], { ha: 'right' }); put(wb, sh, 'E3', null, { color: '#5f6368' }); put(wb, sh, 'F3', null, { fmt: 'd mmmm yyyy' });
    row(wb, sh, 'E4', ['Jatuh tempo', '=F3+14'], { ha: 'right' }); put(wb, sh, 'E4', null, { color: '#5f6368' }); put(wb, sh, 'F4', null, { fmt: 'd mmmm yyyy' });
    put(wb, sh, 'B7', 'DITAGIHKAN KEPADA', { b: true, fs: 8, color: '#5f6368' });
    put(wb, sh, 'B8', 'CV Maju Bersama', { b: true });
    put(wb, sh, 'B9', 'Jl. Diponegoro 21, Bandung');
    row(wb, sh, 'B11', ['No', 'Deskripsi', 'Qty', 'Harga satuan', 'Jumlah'], { b: true, bg: '#174ea6', color: '#ffffff', va: 'middle' });
    styleRange(sh, 'D11:F11', { ha: 'right' });
    sh.rowH.set(10, 28);
    const items = [['Jasa desain antarmuka aplikasi', 1, 8500000], ['Pengembangan modul laporan', 2, 4250000], ['Lisensi tahunan server', 1, 3600000], ['Pelatihan pengguna (per sesi)', 3, 1250000]];
    for (let i = 0; i < 8; i++) {
      const r = 12 + i, it = items[i];
      row(wb, sh, 'B' + r, [it ? i + 1 : null, it ? it[0] : null, it ? it[1] : null, it ? it[2] : null, `=IF(D${r}="","",D${r}*E${r})`], { bb: thin });
      styleRange(sh, `E${r}:F${r}`, { fmt: RP });
      put(wb, sh, 'B' + r, null, { ha: 'center', color: '#5f6368' });
    }
    row(wb, sh, 'E21', ['Subtotal', '=SUM(F12:F19)']);
    row(wb, sh, 'E22', ['Diskon', '=F21*0.05']);
    row(wb, sh, 'E23', ['PPN 11%', '=(F21-F22)*0.11']);
    row(wb, sh, 'E24', ['TOTAL', '=F21-F22+F23'], { b: true, fs: 12, color: '#174ea6', bt: { w: 2, style: 'solid', color: '#174ea6' } });
    styleRange(sh, 'F21:F24', { fmt: RP }); styleRange(sh, 'E21:E24', { ha: 'right' });
    put(wb, sh, 'B26', 'Terbilang:', { i: true, color: '#5f6368' });
    put(wb, sh, 'C26', '=PROPER(TERBILANG(ROUND(F24,0)))&" Rupiah"', { i: true });
    put(wb, sh, 'B28', 'Pembayaran ditransfer ke BCA 123-456-7890 a.n. PT Contoh Nusantara.', { color: '#5f6368', fs: 9 });
    put(wb, sh, 'B29', 'Terima kasih atas kerja sama Anda.', { color: '#5f6368', fs: 9 });
  });
}

function sales() {
  return make('Laporan Penjualan', (wb, sh) => {
    sh.name = 'Data';
    widths(sh, [110, 110, 140, 110, 70, 120, 140]);
    row(wb, sh, 'A1', ['Tanggal', 'Wilayah', 'Produk', 'Sales', 'Unit', 'Harga', 'Total'], { b: true, bg: '#e8f0fe', color: '#174ea6', bb: { w: 1, style: 'solid', color: '#174ea6' } });
    const regions = ['Jawa', 'Sumatra', 'Kalimantan', 'Sulawesi', 'Bali & NT'];
    const products = [['Laptop Pro 14', 14500000], ['Monitor 27"', 3900000], ['Keyboard Nirkabel', 650000], ['Headset Rapat', 1200000], ['Webcam HD', 850000]];
    const people = ['Rina', 'Budi', 'Sari', 'Andi', 'Dewi', 'Fajar'];
    let seed = 7;
    const rnd = n => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
    const start = serial(2026, 1, 5);
    for (let i = 0; i < 60; i++) {
      const r = i + 2;
      const p = products[rnd(products.length)];
      sh.put(r - 1, 0, { v: start + i * 4 + rnd(3) });
      row(wb, sh, 'B' + r, [regions[rnd(regions.length)], p[0], people[rnd(people.length)], 1 + rnd(12), p[1], `=E${r}*F${r}`]);
    }
    styleRange(sh, 'A2:A61', { fmt: 'dd/mm/yyyy' });
    styleRange(sh, 'F2:G61', { fmt: RP });
    sh.freezeR = 1;
    sh.filter = { r1: 0, c1: 0, r2: 60, c2: 6, crit: {} };
    const s2 = wb.addSheet('Ringkasan', 1);
    widths(s2, [160, 160, 120, 30, 160, 160]);
    put(wb, s2, 'A1', 'Ringkasan Penjualan 2026', { b: true, fs: 16 });
    put(wb, s2, 'A2', '=COUNTA(Data!B2:B61)&" transaksi · total "&TEXT(SUM(Data!G2:G61),"""Rp""#,##0")', { color: '#5f6368' });
    row(wb, s2, 'A4', ['Wilayah', 'Total penjualan', 'Porsi'], { b: true, bb: { w: 2, style: 'solid', color: '#202124' } });
    put(wb, s2, 'A5', '=SORT(UNIQUE(Data!B2:B61))');
    put(wb, s2, 'B5', '=SUMIF(Data!B2:B61,A5#,Data!G2:G61)');
    put(wb, s2, 'C5', '=B5#/SUM(Data!G2:G61)');
    styleRange(s2, 'B5:B9', { fmt: RP }); styleRange(s2, 'C5:C9', { fmt: '0.0%' });
    s2.cf.push({ id: uid('cf'), ranges: [{ r1: 4, c1: 2, r2: 8, c2: 2 }], type: 'bar', bar: { color: '#4285f4' } });
    row(wb, s2, 'E4', ['Produk terlaris', 'Unit terjual'], { b: true, bb: { w: 2, style: 'solid', color: '#202124' } });
    put(wb, s2, 'E5', '=QUERY(Data!C2:E61,"select C, sum(E) group by C order by sum(E) desc label sum(E) \'\'",0)');
    put(wb, s2, 'A12', 'Penjualan per sales (XLOOKUP)', { b: true });
    row(wb, s2, 'A13', ['Nama sales', 'Rina'], {}); put(wb, s2, 'B13', null, { bg: '#fef7e0' });
    row(wb, s2, 'A14', ['Total', '=SUMIFS(Data!G2:G61,Data!D2:D61,B13)']); put(wb, s2, 'B14', null, { fmt: RP, b: true });
    row(wb, s2, 'A15', ['Transaksi terakhir', '=XLOOKUP(B13,Data!D2:D61,Data!A2:A61,"-",0,-1)']); put(wb, s2, 'B15', null, { fmt: 'd mmm yyyy' });
    s2.dv.push({ id: uid('dv'), type: 'list', ranges: [{ r1: 12, c1: 1, r2: 12, c2: 1 }], items: people, colors: people.map(() => '#e8f0fe'), chip: 'chip', strict: true });
    s2.charts.push({ id: uid('ch'), type: 'doughnut', range: 'A4:B9', anchor: { r: 16, c: 0 }, dx: 0, dy: 0, w: 440, h: 300, opts: { title: 'Penjualan per wilayah', legend: 'right', headers: 'on', labels: 'on' } });
    s2.charts.push({ id: uid('ch'), type: 'bar', range: 'E4:F9', anchor: { r: 16, c: 4 }, dx: 0, dy: 0, w: 440, h: 300, opts: { title: 'Unit terjual per produk', legend: 'none', headers: 'on', labels: 'on', colors: ['#34a853'] } });
    wb.active = 1;
  });
}

function gantt() {
  return make('Jadwal Proyek', (wb, sh) => {
    sh.name = 'Gantt';
    widths(sh, [220, 100, 70, 100, 80]);
    put(wb, sh, 'A1', 'Jadwal Proyek', { b: true, fs: 16 });
    row(wb, sh, 'A2', ['Mulai proyek', '=TODAY()-WEEKDAY(TODAY(),3)']); put(wb, sh, 'B2', null, { fmt: 'd mmm yyyy', b: true });
    row(wb, sh, 'A4', ['Tugas', 'Mulai', 'Durasi', 'Selesai', 'Progres'], { b: true, bg: '#f1f3f4', va: 'middle' });
    const tasks = [['Kick-off & kebutuhan', 0, 4, 1], ['Desain sistem', 3, 6, 0.9], ['Pengembangan backend', 8, 12, 0.55], ['Pengembangan frontend', 10, 12, 0.4], ['Integrasi & pengujian', 20, 7, 0.1], ['Pelatihan pengguna', 26, 3, 0], ['Go-live', 29, 1, 0]];
    tasks.forEach((t, i) => {
      const r = 5 + i;
      row(wb, sh, 'A' + r, [t[0], `=$B$2+${t[1]}`, t[2], `=B${r}+C${r}-1`, t[3]]);
      put(wb, sh, 'B' + r, null, { fmt: 'd mmm' }); put(wb, sh, 'D' + r, null, { fmt: 'd mmm' }); put(wb, sh, 'E' + r, null, { fmt: '0%' });
    });
    const days = 35;
    for (let j = 0; j < days; j++) {
      const c = 5 + j;
      sh.colW.set(c, 26);
      setInput(wb, sh, 3, c, j === 0 ? '=$B$2' : `=${colLetter(c - 1)}4+1`);
      sh.setStyle(3, c, { fmt: 'd', ha: 'center', b: true, bg: '#f1f3f4', fs: 8, va: 'middle' });
      setInput(wb, sh, 2, c, `=IF(OR(${colLetter(c)}4=$B$2,DAY(${colLetter(c)}4)=1),TEXT(${colLetter(c)}4,"mmm"),"")`);
      sh.setStyle(2, c, { fs: 8, color: '#5f6368' });
    }
    sh.rowH.set(3, 26);
    const g = { r1: 4, c1: 5, r2: 4 + tasks.length - 1, c2: 5 + days - 1 };
    sh.cf.push({ id: uid('cf'), ranges: [g], type: 'formula', v1: '=AND(F$4>=$B5,F$4<$B5+$C5*$E5)', style: { bg: '#1a73e8' } });
    sh.cf.push({ id: uid('cf'), ranges: [g], type: 'formula', v1: '=AND(F$4>=$B5,F$4<=$D5)', style: { bg: '#aecbfa' } });
    sh.cf.push({ id: uid('cf'), ranges: [{ ...g, r1: 3 }], type: 'formula', v1: '=F$4=TODAY()', style: { bg: '#fce8b2' } });
    sh.cf.push({ id: uid('cf'), ranges: [{ r1: 4, c1: 4, r2: 4 + tasks.length - 1, c2: 4 }], type: 'bar', bar: { color: '#34a853' } });
    sh.freezeC = 5; sh.freezeR = 4;
    sh.grid = true;
  });
}
function colLetter(c) { let s = ''; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; }

function loan() {
  return make('Simulasi Kredit', (wb, sh) => {
    sh.name = 'Kredit';
    widths(sh, [190, 160, 150, 150, 160, 30]);
    put(wb, sh, 'A1', 'Simulasi Kredit', { b: true, fs: 16 });
    put(wb, sh, 'A2', 'Ubah sel kuning; tabel angsuran dihitung otomatis dengan array dinamis.', { color: '#5f6368' });
    const inp = { bg: '#fef7e0', bb: { w: 1, style: 'solid', color: '#f9ab00' } };
    row(wb, sh, 'A4', ['Pokok pinjaman', 250000000]); put(wb, sh, 'B4', null, { ...inp, fmt: RP });
    row(wb, sh, 'A5', ['Bunga per tahun', '9.5%']); put(wb, sh, 'B5', null, { ...inp, fmt: '0.00%' });
    row(wb, sh, 'A6', ['Tenor (bulan)', 36]); put(wb, sh, 'B6', null, inp);
    row(wb, sh, 'A8', ['Angsuran per bulan', '=PMT(B5/12,B6,-B4)'], { b: true }); put(wb, sh, 'B8', null, { fmt: RP, color: '#174ea6', fs: 12 });
    row(wb, sh, 'A9', ['Total bunga', '=B8*B6-B4']); put(wb, sh, 'B9', null, { fmt: RP });
    row(wb, sh, 'A10', ['Total pembayaran', '=B8*B6']); put(wb, sh, 'B10', null, { fmt: RP });
    row(wb, sh, 'A12', ['Bulan ke', 'Angsuran', 'Bunga', 'Pokok', 'Sisa pinjaman'], { b: true, bg: '#e8f0fe', color: '#174ea6' });
    put(wb, sh, 'A13', '=SEQUENCE(B6)');
    put(wb, sh, 'B13', '=PMT($B$5/12,$B$6,-$B$4)+0*A13#');
    put(wb, sh, 'C13', '=IPMT($B$5/12,A13#,$B$6,-$B$4)');
    put(wb, sh, 'D13', '=PPMT($B$5/12,A13#,$B$6,-$B$4)');
    put(wb, sh, 'E13', '=$B$4-SCAN(0,D13#,LAMBDA(a,x,a+x))');
    styleRange(sh, 'B13:E372', { fmt: '#,##0' });
    sh.freezeR = 12;
  });
}

export const TEMPLATES = [
  { id: 'blank', name: 'Spreadsheet kosong', icon: 'add', desc: 'Mulai dari awal', build: () => newWorkbook() },
  { id: 'welcome', name: 'Spreadsheet kosong', icon: 'add', desc: '', build: () => newWorkbook() },
  { id: 'budget', name: 'Anggaran bulanan', icon: 'account_balance_wallet', desc: 'Anggaran vs aktual, bilah data, diagram', build: budget },
  { id: 'todo', name: 'Daftar tugas', icon: 'checklist', desc: 'Kotak centang, chip status, tenggat', build: todo },
  { id: 'invoice', name: 'Faktur', icon: 'receipt_long', desc: 'Faktur dengan PPN dan terbilang', build: invoice },
  { id: 'sales', name: 'Laporan penjualan', icon: 'monitoring', desc: 'UNIQUE, SUMIF, QUERY, XLOOKUP, diagram', build: sales },
  { id: 'gantt', name: 'Jadwal proyek', icon: 'view_timeline', desc: 'Gantt dengan format bersyarat', build: gantt },
  { id: 'loan', name: 'Simulasi kredit', icon: 'calculate', desc: 'PMT, IPMT, SEQUENCE, SCAN, LAMBDA', build: loan },
];
