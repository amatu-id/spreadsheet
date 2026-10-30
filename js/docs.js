// Function reference used by autocomplete, signature help and the function list.
import { F } from './formula/functions.js';
import './formula/functions2.js';

const RAW = {
  Matematika: `
ABS|angka|Nilai absolut sebuah angka.
ACOS|angka|Arkus kosinus, dalam radian.
ACOSH|angka|Kosinus hiperbolik invers.
ACOT|angka|Arkus kotangen.
ACOTH|angka|Kotangen hiperbolik invers.
ARABIC|teks_romawi|Mengubah angka Romawi menjadi angka Arab.
ASIN|angka|Arkus sinus, dalam radian.
ASINH|angka|Sinus hiperbolik invers.
ATAN|angka|Arkus tangen, dalam radian.
ATAN2|x, y|Arkus tangen dari koordinat x dan y.
ATANH|angka|Tangen hiperbolik invers.
BASE|angka, basis, [panjang_min]|Mengubah angka ke basis lain (2–36) sebagai teks.
CEILING|angka, [signifikansi]|Membulatkan ke atas ke kelipatan terdekat.
CEILING.MATH|angka, [signifikansi], [mode]|Membulatkan ke atas ke kelipatan terdekat.
CEILING.PRECISE|angka, [signifikansi]|Membulatkan ke atas tanpa memperhatikan tanda.
COMBIN|n, k|Jumlah kombinasi k dari n.
COMBINA|n, k|Jumlah kombinasi dengan pengulangan.
COS|sudut|Kosinus sudut dalam radian.
COSH|angka|Kosinus hiperbolik.
COT|sudut|Kotangen sudut.
COTH|angka|Kotangen hiperbolik.
CSC|sudut|Kosekan sudut.
CSCH|angka|Kosekan hiperbolik.
DECIMAL|teks, basis|Mengubah teks berbasis tertentu ke desimal.
DEGREES|radian|Mengubah radian ke derajat.
EVEN|angka|Membulatkan ke atas ke bilangan genap terdekat.
EXP|angka|e pangkat angka.
FACT|angka|Faktorial.
FACTDOUBLE|angka|Faktorial ganda.
FLOOR|angka, [signifikansi]|Membulatkan ke bawah ke kelipatan terdekat.
FLOOR.MATH|angka, [signifikansi], [mode]|Membulatkan ke bawah ke kelipatan terdekat.
FLOOR.PRECISE|angka, [signifikansi]|Membulatkan ke bawah tanpa memperhatikan tanda.
GCD|angka1, [angka2, ...]|Faktor persekutuan terbesar.
INT|angka|Membulatkan ke bawah ke bilangan bulat.
ISO.CEILING|angka, [signifikansi]|Pembulatan ke atas standar ISO.
LCM|angka1, [angka2, ...]|Kelipatan persekutuan terkecil.
LN|angka|Logaritma natural.
LOG|angka, [basis]|Logaritma dengan basis tertentu (default 10).
LOG10|angka|Logaritma basis 10.
MDETERM|matriks|Determinan matriks.
MINVERSE|matriks|Invers matriks.
MMULT|matriks1, matriks2|Perkalian matriks.
MOD|dividen, pembagi|Sisa hasil bagi.
MROUND|angka, kelipatan|Membulatkan ke kelipatan terdekat.
MULTINOMIAL|angka1, [angka2, ...]|Multinomial dari sekumpulan angka.
MUNIT|dimensi|Matriks satuan.
ODD|angka|Membulatkan ke atas ke bilangan ganjil terdekat.
PI||Nilai π (3,14159…).
POWER|basis, eksponen|Angka dipangkatkan.
PRODUCT|angka1, [angka2, ...]|Hasil kali semua angka.
QUOTIENT|pembilang, penyebut|Bagian bulat hasil bagi.
RADIANS|derajat|Mengubah derajat ke radian.
RAND||Angka acak antara 0 dan 1.
RANDARRAY|[baris], [kolom], [min], [maks], [bulat]|Array angka acak.
RANDBETWEEN|bawah, atas|Bilangan bulat acak di antara dua angka.
ROMAN|angka, [bentuk]|Mengubah angka ke angka Romawi.
ROUND|angka, [digit]|Membulatkan ke jumlah digit tertentu.
ROUNDDOWN|angka, [digit]|Membulatkan ke bawah (menuju nol).
ROUNDUP|angka, [digit]|Membulatkan ke atas (menjauhi nol).
SEC|sudut|Sekan sudut.
SECH|angka|Sekan hiperbolik.
SEQUENCE|baris, [kolom], [mulai], [langkah]|Membuat deret angka berurutan.
SERIESSUM|x, n, m, koefisien|Jumlah deret pangkat.
SIGN|angka|Tanda angka: 1, 0, atau -1.
SIN|sudut|Sinus sudut dalam radian.
SINH|angka|Sinus hiperbolik.
SQRT|angka|Akar kuadrat.
SQRTPI|angka|Akar dari angka × π.
SUBTOTAL|kode_fungsi, rentang1, [rentang2, ...]|Subtotal dengan fungsi agregat (abaikan baris tersaring).
AGGREGATE|kode_fungsi, opsi, rentang, [k]|Agregat dengan opsi mengabaikan error/baris tersembunyi.
SUM|angka1, [angka2, ...]|Menjumlahkan sekumpulan angka atau sel.
SUMIF|rentang, kriteria, [rentang_jumlah]|Menjumlahkan sel yang memenuhi kriteria.
SUMIFS|rentang_jumlah, rentang_kriteria1, kriteria1, ...|Menjumlahkan sel yang memenuhi banyak kriteria.
SUMPRODUCT|array1, [array2, ...]|Jumlah dari hasil kali elemen array.
SUMSQ|angka1, [angka2, ...]|Jumlah kuadrat.
SUMX2MY2|array_x, array_y|Jumlah selisih kuadrat.
SUMX2PY2|array_x, array_y|Jumlah dari jumlah kuadrat.
SUMXMY2|array_x, array_y|Jumlah kuadrat selisih.
TAN|sudut|Tangen sudut.
TANH|angka|Tangen hiperbolik.
TRUNC|angka, [digit]|Memotong angka menjadi bilangan bulat atau desimal tertentu.
`,
  Statistik: `
AVEDEV|angka1, [angka2, ...]|Rata-rata deviasi absolut.
AVERAGE|angka1, [angka2, ...]|Rata-rata aritmetika.
AVERAGEA|nilai1, [nilai2, ...]|Rata-rata termasuk teks dan nilai logika.
AVERAGEIF|rentang, kriteria, [rentang_rata]|Rata-rata sel yang memenuhi kriteria.
AVERAGEIFS|rentang_rata, rentang_kriteria1, kriteria1, ...|Rata-rata dengan banyak kriteria.
BETA.DIST|x, alfa, beta, kumulatif, [A], [B]|Distribusi beta.
BINOM.DIST|k, n, p, kumulatif|Distribusi binomial.
CHISQ.DIST|x, df, kumulatif|Distribusi chi-kuadrat.
CHISQ.DIST.RT|x, df|Distribusi chi-kuadrat ekor kanan.
CHISQ.INV|p, df|Invers distribusi chi-kuadrat.
CHISQ.INV.RT|p, df|Invers chi-kuadrat ekor kanan.
CONFIDENCE.NORM|alfa, std_dev, ukuran|Interval kepercayaan (normal).
CONFIDENCE.T|alfa, std_dev, ukuran|Interval kepercayaan (t-Student).
CORREL|data1, data2|Koefisien korelasi.
COUNT|nilai1, [nilai2, ...]|Menghitung sel berisi angka.
COUNTA|nilai1, [nilai2, ...]|Menghitung sel yang tidak kosong.
COUNTBLANK|rentang|Menghitung sel kosong.
COUNTIF|rentang, kriteria|Menghitung sel yang memenuhi kriteria.
COUNTIFS|rentang_kriteria1, kriteria1, ...|Menghitung sel dengan banyak kriteria.
COUNTUNIQUE|nilai1, [nilai2, ...]|Menghitung nilai unik.
COVARIANCE.P|data1, data2|Kovarians populasi.
COVARIANCE.S|data1, data2|Kovarians sampel.
DEVSQ|angka1, [angka2, ...]|Jumlah kuadrat deviasi.
EXPON.DIST|x, lambda, kumulatif|Distribusi eksponensial.
F.DIST|x, df1, df2, kumulatif|Distribusi F.
F.DIST.RT|x, df1, df2|Distribusi F ekor kanan.
FISHER|x|Transformasi Fisher.
FISHERINV|y|Invers transformasi Fisher.
FORECAST|x, data_y, data_x|Memprediksi nilai dengan regresi linear.
FORECAST.LINEAR|x, data_y, data_x|Memprediksi nilai dengan regresi linear.
FREQUENCY|data, batas_kelas|Distribusi frekuensi sebagai array vertikal.
GAMMA|angka|Fungsi gamma.
GAMMA.DIST|x, alfa, beta, kumulatif|Distribusi gamma.
GAMMALN|angka|Logaritma natural fungsi gamma.
GAUSS|z|Peluang distribusi normal standar dikurangi 0,5.
GEOMEAN|angka1, [angka2, ...]|Rata-rata geometrik.
GROWTH|data_y, [data_x], [x_baru]|Tren pertumbuhan eksponensial.
HARMEAN|angka1, [angka2, ...]|Rata-rata harmonik.
INTERCEPT|data_y, data_x|Titik potong garis regresi.
KURT|angka1, [angka2, ...]|Kurtosis.
LARGE|data, k|Nilai terbesar ke-k.
LINEST|data_y, [data_x]|Statistik garis regresi linear.
LOGEST|data_y, [data_x]|Statistik kurva eksponensial.
LOGNORM.DIST|x, rata, std_dev, kumulatif|Distribusi lognormal.
LOGNORM.INV|p, rata, std_dev|Invers lognormal.
MAX|nilai1, [nilai2, ...]|Nilai maksimum.
MAXA|nilai1, [nilai2, ...]|Nilai maksimum termasuk teks/logika.
MAXIFS|rentang_maks, rentang_kriteria1, kriteria1, ...|Maksimum dengan kriteria.
MEDIAN|angka1, [angka2, ...]|Nilai tengah.
MIN|nilai1, [nilai2, ...]|Nilai minimum.
MINA|nilai1, [nilai2, ...]|Nilai minimum termasuk teks/logika.
MINIFS|rentang_min, rentang_kriteria1, kriteria1, ...|Minimum dengan kriteria.
MODE|angka1, [angka2, ...]|Nilai yang paling sering muncul.
MODE.MULT|angka1, [angka2, ...]|Semua modus sebagai array vertikal.
MODE.SNGL|angka1, [angka2, ...]|Nilai yang paling sering muncul.
NEGBINOM.DIST|gagal, sukses, p, kumulatif|Distribusi binomial negatif.
NORM.DIST|x, rata, std_dev, kumulatif|Distribusi normal.
NORM.INV|p, rata, std_dev|Invers distribusi normal.
NORM.S.DIST|z, kumulatif|Distribusi normal standar.
NORM.S.INV|p|Invers distribusi normal standar.
PEARSON|data1, data2|Koefisien korelasi Pearson.
PERCENTILE|data, k|Persentil ke-k.
PERCENTILE.EXC|data, k|Persentil eksklusif.
PERCENTILE.INC|data, k|Persentil inklusif.
PERCENTRANK|data, x, [signifikansi]|Peringkat persentase.
PERCENTRANK.EXC|data, x, [signifikansi]|Peringkat persentase eksklusif.
PERCENTRANK.INC|data, x, [signifikansi]|Peringkat persentase inklusif.
PERMUT|n, k|Jumlah permutasi.
PERMUTATIONA|n, k|Permutasi dengan pengulangan.
PHI|x|Kepadatan distribusi normal standar.
POISSON.DIST|x, rata, kumulatif|Distribusi Poisson.
QUARTILE|data, kuartil|Kuartil data.
QUARTILE.EXC|data, kuartil|Kuartil eksklusif.
QUARTILE.INC|data, kuartil|Kuartil inklusif.
RANK|angka, rentang, [urutan]|Peringkat angka dalam daftar.
RANK.AVG|angka, rentang, [urutan]|Peringkat (rata-rata untuk nilai sama).
RANK.EQ|angka, rentang, [urutan]|Peringkat angka dalam daftar.
RSQ|data_y, data_x|Kuadrat koefisien korelasi.
SKEW|angka1, [angka2, ...]|Kemiringan distribusi.
SKEW.P|angka1, [angka2, ...]|Kemiringan populasi.
SLOPE|data_y, data_x|Kemiringan garis regresi.
SMALL|data, k|Nilai terkecil ke-k.
STANDARDIZE|x, rata, std_dev|Nilai terstandar (skor z).
STDEV|angka1, [angka2, ...]|Simpangan baku sampel.
STDEV.P|angka1, [angka2, ...]|Simpangan baku populasi.
STDEV.S|angka1, [angka2, ...]|Simpangan baku sampel.
STDEVA|nilai1, [nilai2, ...]|Simpangan baku sampel termasuk teks/logika.
STDEVP|angka1, [angka2, ...]|Simpangan baku populasi.
STDEVPA|nilai1, [nilai2, ...]|Simpangan baku populasi termasuk teks/logika.
STEYX|data_y, data_x|Galat standar prediksi y.
T.DIST|x, df, kumulatif|Distribusi t-Student.
T.DIST.2T|x, df|Distribusi t dua ekor.
T.DIST.RT|x, df|Distribusi t ekor kanan.
T.INV|p, df|Invers distribusi t.
T.INV.2T|p, df|Invers distribusi t dua ekor.
T.TEST|data1, data2, ekor, tipe|Probabilitas uji-t.
TREND|data_y, [data_x], [x_baru], [konstanta]|Nilai tren linear.
TRIMMEAN|data, persen|Rata-rata setelah memangkas data ekstrem.
VAR|angka1, [angka2, ...]|Varians sampel.
VAR.P|angka1, [angka2, ...]|Varians populasi.
VAR.S|angka1, [angka2, ...]|Varians sampel.
VARA|nilai1, [nilai2, ...]|Varians sampel termasuk teks/logika.
VARP|angka1, [angka2, ...]|Varians populasi.
VARPA|nilai1, [nilai2, ...]|Varians populasi termasuk teks/logika.
WEIBULL.DIST|x, alfa, beta, kumulatif|Distribusi Weibull.
Z.TEST|data, x, [sigma]|Nilai-P uji z satu ekor.
`,
  Logika: `
AND|logika1, [logika2, ...]|TRUE jika semua argumen bernilai benar.
BYCOL|array, lambda|Menerapkan LAMBDA ke setiap kolom.
BYROW|array, lambda|Menerapkan LAMBDA ke setiap baris.
FALSE||Nilai logika FALSE.
IF|ekspresi_logika, nilai_jika_benar, [nilai_jika_salah]|Mengembalikan satu nilai jika benar dan nilai lain jika salah.
IFERROR|nilai, [nilai_jika_error]|Nilai alternatif bila terjadi error.
IFNA|nilai, nilai_jika_na|Nilai alternatif bila hasilnya #N/A.
IFS|kondisi1, nilai1, [kondisi2, nilai2, ...]|Menguji beberapa kondisi secara berurutan.
LAMBDA|[param1, ...], rumus|Membuat fungsi kustom yang dapat dipanggil.
LET|nama1, nilai1, [nama2, nilai2, ...], rumus|Memberi nama pada hasil perhitungan.
MAKEARRAY|baris, kolom, lambda|Membuat array dari LAMBDA.
MAP|array1, [array2, ...], lambda|Memetakan setiap nilai dengan LAMBDA.
NOT|logika|Membalik nilai logika.
OR|logika1, [logika2, ...]|TRUE jika salah satu argumen benar.
REDUCE|awal, array, lambda|Mereduksi array menjadi satu nilai.
SCAN|awal, array, lambda|Akumulasi bertahap sebagai array.
SWITCH|ekspresi, kasus1, nilai1, [..., default]|Mencocokkan ekspresi dengan daftar kasus.
TRUE||Nilai logika TRUE.
XOR|logika1, [logika2, ...]|TRUE jika jumlah argumen benar ganjil.
`,
  'Pencarian & Referensi': `
ADDRESS|baris, kolom, [mode_absolut], [gaya_A1], [sheet]|Alamat sel sebagai teks.
ARRAY_CONSTRAIN|array, baris, kolom|Membatasi ukuran hasil array.
ARRAYFORMULA|rumus_array|Menampilkan hasil array dari rumus.
CHOOSE|indeks, pilihan1, [pilihan2, ...]|Memilih nilai berdasarkan indeks.
CHOOSECOLS|array, kolom1, [kolom2, ...]|Mengambil kolom tertentu dari array.
CHOOSEROWS|array, baris1, [baris2, ...]|Mengambil baris tertentu dari array.
COLUMN|[referensi]|Nomor kolom.
COLUMNS|array|Jumlah kolom.
DROP|array, baris, [kolom]|Membuang baris/kolom dari awal atau akhir array.
EXPAND|array, baris, [kolom], [pengisi]|Memperluas array ke ukuran tertentu.
FILTER|rentang, kondisi1, [kondisi2 atau jika_kosong]|Menyaring rentang berdasarkan kondisi.
FLATTEN|rentang1, [rentang2, ...]|Meratakan rentang menjadi satu kolom.
FORMULATEXT|referensi|Teks rumus pada sel.
HLOOKUP|kunci, rentang, indeks_baris, [terurut]|Pencarian horizontal.
HSTACK|array1, [array2, ...]|Menggabungkan array secara horizontal.
INDEX|referensi, [baris], [kolom]|Nilai pada posisi baris dan kolom tertentu.
INDIRECT|teks_referensi, [gaya_A1]|Referensi dari teks.
LOOKUP|kunci, rentang_cari, [rentang_hasil]|Pencarian pada baris atau kolom.
MATCH|kunci, rentang, [tipe]|Posisi relatif sebuah nilai.
OFFSET|referensi, baris, kolom, [tinggi], [lebar]|Referensi yang digeser.
QUERY|data, kueri, [header]|Kueri ala SQL (Google Visualization) atas data.
ROW|[referensi]|Nomor baris.
ROWS|array|Jumlah baris.
SORT|rentang, [kolom_urut], [naik], [menurut_kolom]|Mengurutkan rentang.
SORTBY|array, menurut1, [urutan1], ...|Mengurutkan berdasarkan array lain.
SORTN|rentang, [n], [mode_seri], [kolom], [naik]|N baris teratas setelah diurutkan.
TAKE|array, baris, [kolom]|Mengambil baris/kolom dari awal atau akhir array.
TOCOL|array, [abaikan], [per_kolom]|Mengubah array menjadi satu kolom.
TOROW|array, [abaikan], [per_kolom]|Mengubah array menjadi satu baris.
TRANSPOSE|array|Menukar baris dan kolom.
UNIQUE|rentang, [per_kolom], [hanya_sekali]|Nilai unik dari rentang.
VLOOKUP|kunci, rentang, indeks_kolom, [terurut]|Pencarian vertikal pada kolom pertama.
VSTACK|array1, [array2, ...]|Menggabungkan array secara vertikal.
WRAPCOLS|vektor, jumlah, [pengisi]|Membungkus vektor menjadi kolom.
WRAPROWS|vektor, jumlah, [pengisi]|Membungkus vektor menjadi baris.
XLOOKUP|kunci, array_cari, array_hasil, [jika_tidak_ada], [mode_cocok], [mode_cari]|Pencarian modern ke segala arah.
XMATCH|kunci, array, [mode_cocok], [mode_cari]|Posisi relatif (versi modern MATCH).
HYPERLINK|url, [label]|Membuat tautan.
IMAGE|url, [mode], [tinggi], [lebar]|Menampilkan gambar di dalam sel.
SPARKLINE|data, [opsi]|Diagram mini di dalam sel.
AREAS|referensi|Jumlah area dalam referensi.
SHEET|[nilai]|Nomor sheet.
SHEETS||Jumlah sheet.
`,
  Teks: `
ARRAYTOTEXT|array, [format]|Array sebagai teks.
CHAR|angka|Karakter dari kode.
CLEAN|teks|Menghapus karakter yang tidak dapat dicetak.
CODE|teks|Kode numerik karakter pertama.
CONCAT|teks1, [teks2, ...]|Menggabungkan teks.
CONCATENATE|teks1, [teks2, ...]|Menggabungkan teks.
DOLLAR|angka, [desimal]|Format mata uang sebagai teks.
EXACT|teks1, teks2|Membandingkan dua teks (peka huruf besar/kecil).
FIND|cari, dalam_teks, [mulai]|Posisi teks (peka huruf besar/kecil).
FIXED|angka, [desimal], [tanpa_pemisah]|Angka dengan desimal tetap sebagai teks.
JOIN|pemisah, nilai1, [nilai2, ...]|Menggabungkan nilai dengan pemisah.
LEFT|teks, [jumlah]|Karakter dari kiri.
LEN|teks|Panjang teks.
LOWER|teks|Huruf kecil.
MID|teks, mulai, jumlah|Karakter dari tengah teks.
NUMBERVALUE|teks, [pemisah_desimal], [pemisah_ribuan]|Teks menjadi angka sesuai lokal.
PROPER|teks|Huruf kapital di awal setiap kata.
REGEXEXTRACT|teks, ekspresi_reguler|Mengekstrak teks yang cocok dengan regex.
REGEXMATCH|teks, ekspresi_reguler|TRUE jika teks cocok dengan regex.
REGEXREPLACE|teks, ekspresi_reguler, pengganti|Mengganti teks dengan regex.
REPLACE|teks, mulai, jumlah, teks_baru|Mengganti sebagian teks berdasarkan posisi.
REPT|teks, jumlah|Mengulang teks.
RIGHT|teks, [jumlah]|Karakter dari kanan.
SEARCH|cari, dalam_teks, [mulai]|Posisi teks (tidak peka huruf besar/kecil, mendukung wildcard).
SPLIT|teks, pemisah, [per_karakter], [hapus_kosong]|Memecah teks menjadi kolom.
SUBSTITUTE|teks, lama, baru, [ke]|Mengganti teks tertentu.
T|nilai|Teks jika nilai berupa teks.
TEXT|nilai, format|Memformat angka sebagai teks.
TEXTAFTER|teks, pemisah, [ke], [mode], [akhir], [jika_tidak_ada]|Teks setelah pemisah.
TEXTBEFORE|teks, pemisah, [ke], [mode], [akhir], [jika_tidak_ada]|Teks sebelum pemisah.
TEXTJOIN|pemisah, abaikan_kosong, teks1, [teks2, ...]|Menggabungkan teks dengan pemisah.
TEXTSPLIT|teks, pemisah_kolom, [pemisah_baris], [abaikan_kosong], [mode], [pengisi]|Memecah teks menjadi baris & kolom.
TERBILANG|angka|Mengeja angka dalam bahasa Indonesia (mis. 1250 → seribu dua ratus lima puluh).
TRIM|teks|Menghapus spasi berlebih.
UNICHAR|angka|Karakter Unicode.
UNICODE|teks|Kode Unicode karakter pertama.
UPPER|teks|Huruf kapital.
VALUE|teks|Teks menjadi angka.
VALUETOTEXT|nilai, [format]|Nilai sebagai teks.
`,
  'Tanggal & Waktu': `
DATE|tahun, bulan, hari|Membuat tanggal.
DATEDIF|tanggal_mulai, tanggal_akhir, satuan|Selisih tanggal ("Y", "M", "D", "MD", "YM", "YD").
DATEVALUE|teks_tanggal|Teks menjadi tanggal.
DAY|tanggal|Hari dalam bulan.
DAYS|tanggal_akhir, tanggal_mulai|Jumlah hari di antara dua tanggal.
DAYS360|tanggal_mulai, tanggal_akhir, [metode]|Selisih hari berdasarkan tahun 360 hari.
EDATE|tanggal_mulai, bulan|Tanggal beberapa bulan sebelum/sesudah.
EOMONTH|tanggal_mulai, bulan|Akhir bulan beberapa bulan sebelum/sesudah.
EPOCHTODATE|timestamp, [satuan]|Timestamp Unix menjadi tanggal waktu.
HOUR|waktu|Jam.
ISOWEEKNUM|tanggal|Nomor minggu ISO.
MINUTE|waktu|Menit.
MONTH|tanggal|Bulan.
NETWORKDAYS|tanggal_mulai, tanggal_akhir, [hari_libur]|Jumlah hari kerja.
NETWORKDAYS.INTL|tanggal_mulai, tanggal_akhir, [akhir_pekan], [hari_libur]|Hari kerja dengan akhir pekan kustom.
NOW||Tanggal dan waktu saat ini.
SECOND|waktu|Detik.
TIME|jam, menit, detik|Membuat waktu.
TIMEVALUE|teks_waktu|Teks menjadi waktu.
TODAY||Tanggal hari ini.
WEEKDAY|tanggal, [tipe]|Hari dalam minggu.
WEEKNUM|tanggal, [tipe]|Nomor minggu dalam tahun.
WORKDAY|tanggal_mulai, hari, [hari_libur]|Tanggal setelah sejumlah hari kerja.
WORKDAY.INTL|tanggal_mulai, hari, [akhir_pekan], [hari_libur]|Hari kerja dengan akhir pekan kustom.
YEAR|tanggal|Tahun.
YEARFRAC|tanggal_mulai, tanggal_akhir, [basis]|Pecahan tahun di antara dua tanggal.
`,
  Keuangan: `
CUMIPMT|suku_bunga, periode, nilai_kini, mulai, akhir, tipe|Bunga kumulatif.
CUMPRINC|suku_bunga, periode, nilai_kini, mulai, akhir, tipe|Pokok kumulatif.
DB|biaya, nilai_sisa, umur, periode, [bulan]|Penyusutan saldo menurun tetap.
DDB|biaya, nilai_sisa, umur, periode, [faktor]|Penyusutan saldo menurun ganda.
DOLLARDE|harga_pecahan, pecahan|Harga pecahan menjadi desimal.
DOLLARFR|harga_desimal, pecahan|Harga desimal menjadi pecahan.
EFFECT|suku_nominal, periode_per_tahun|Suku bunga efektif tahunan.
FV|suku_bunga, periode, pembayaran, [nilai_kini], [tipe]|Nilai masa depan investasi.
FVSCHEDULE|pokok, jadwal_suku_bunga|Nilai masa depan dengan suku bunga bervariasi.
IPMT|suku_bunga, periode_ke, periode, nilai_kini, [nilai_akhir], [tipe]|Pembayaran bunga untuk periode tertentu.
IRR|arus_kas, [perkiraan]|Tingkat pengembalian internal.
ISPMT|suku_bunga, periode_ke, periode, nilai_kini|Bunga yang dibayar pada periode tertentu.
MIRR|arus_kas, bunga_pembiayaan, bunga_reinvestasi|IRR yang dimodifikasi.
NOMINAL|suku_efektif, periode_per_tahun|Suku bunga nominal tahunan.
NPER|suku_bunga, pembayaran, nilai_kini, [nilai_akhir], [tipe]|Jumlah periode pembayaran.
NPV|suku_bunga, arus_kas1, [arus_kas2, ...]|Nilai kini bersih.
PDURATION|suku_bunga, nilai_kini, nilai_akhir|Jumlah periode untuk mencapai nilai tertentu.
PMT|suku_bunga, periode, nilai_kini, [nilai_akhir], [tipe]|Pembayaran periodik pinjaman.
PPMT|suku_bunga, periode_ke, periode, nilai_kini, [nilai_akhir], [tipe]|Pembayaran pokok untuk periode tertentu.
PV|suku_bunga, periode, pembayaran, [nilai_akhir], [tipe]|Nilai kini investasi.
RATE|periode, pembayaran, nilai_kini, [nilai_akhir], [tipe], [perkiraan]|Suku bunga per periode.
RRI|periode, nilai_kini, nilai_akhir|Tingkat bunga setara pertumbuhan.
SLN|biaya, nilai_sisa, umur|Penyusutan garis lurus.
SYD|biaya, nilai_sisa, umur, periode|Penyusutan jumlah angka tahun.
XIRR|arus_kas, tanggal, [perkiraan]|IRR untuk arus kas tidak berkala.
XNPV|suku_bunga, arus_kas, tanggal|NPV untuk arus kas tidak berkala.
`,
  Info: `
CELL|jenis_info, [referensi]|Informasi tentang sel.
ERROR.TYPE|nilai_error|Nomor jenis error.
ISBLANK|nilai|TRUE jika sel kosong.
ISDATE|nilai|TRUE jika nilai berupa tanggal.
ISEMAIL|nilai|TRUE jika nilai berupa alamat email.
ISERR|nilai|TRUE jika error selain #N/A.
ISERROR|nilai|TRUE jika nilai berupa error.
ISEVEN|angka|TRUE jika genap.
ISFORMULA|referensi|TRUE jika sel berisi rumus.
ISLOGICAL|nilai|TRUE jika nilai logika.
ISNA|nilai|TRUE jika #N/A.
ISNONTEXT|nilai|TRUE jika bukan teks.
ISNUMBER|nilai|TRUE jika angka.
ISODD|angka|TRUE jika ganjil.
ISOMITTED|argumen|TRUE jika argumen LAMBDA tidak diisi.
ISREF|nilai|TRUE jika referensi.
ISTEXT|nilai|TRUE jika teks.
ISURL|nilai|TRUE jika nilai berupa URL.
N|nilai|Nilai sebagai angka.
NA||Mengembalikan error #N/A.
TYPE|nilai|Jenis nilai (1 angka, 2 teks, 4 logika, 16 error, 64 array).
`,
  Teknik: `
BIN2DEC|biner|Biner ke desimal.
BIN2HEX|biner, [tempat]|Biner ke heksadesimal.
BIN2OCT|biner, [tempat]|Biner ke oktal.
BITAND|angka1, angka2|Operasi AND bitwise.
BITLSHIFT|angka, geser|Geser bit ke kiri.
BITOR|angka1, angka2|Operasi OR bitwise.
BITRSHIFT|angka, geser|Geser bit ke kanan.
BITXOR|angka1, angka2|Operasi XOR bitwise.
CONVERT|angka, dari_satuan, ke_satuan|Konversi satuan ukuran.
DEC2BIN|desimal, [tempat]|Desimal ke biner.
DEC2HEX|desimal, [tempat]|Desimal ke heksadesimal.
DEC2OCT|desimal, [tempat]|Desimal ke oktal.
DELTA|angka1, [angka2]|1 jika dua angka sama.
ERF|batas_bawah, [batas_atas]|Fungsi error.
ERFC|x|Fungsi error komplementer.
GESTEP|angka, [langkah]|1 jika angka ≥ langkah.
HEX2BIN|heksa, [tempat]|Heksadesimal ke biner.
HEX2DEC|heksa|Heksadesimal ke desimal.
HEX2OCT|heksa, [tempat]|Heksadesimal ke oktal.
OCT2BIN|oktal, [tempat]|Oktal ke biner.
OCT2DEC|oktal|Oktal ke desimal.
OCT2HEX|oktal, [tempat]|Oktal ke heksadesimal.
`,
  Database: `
DAVERAGE|database, kolom, kriteria|Rata-rata record yang cocok.
DCOUNT|database, kolom, kriteria|Menghitung angka pada record yang cocok.
DCOUNTA|database, kolom, kriteria|Menghitung sel tidak kosong pada record yang cocok.
DGET|database, kolom, kriteria|Satu nilai dari record yang cocok.
DMAX|database, kolom, kriteria|Nilai maksimum record yang cocok.
DMIN|database, kolom, kriteria|Nilai minimum record yang cocok.
DPRODUCT|database, kolom, kriteria|Hasil kali record yang cocok.
DSTDEV|database, kolom, kriteria|Simpangan baku sampel record yang cocok.
DSTDEVP|database, kolom, kriteria|Simpangan baku populasi record yang cocok.
DSUM|database, kolom, kriteria|Jumlah record yang cocok.
DVAR|database, kolom, kriteria|Varians sampel record yang cocok.
DVARP|database, kolom, kriteria|Varians populasi record yang cocok.
`,
  Operator: `
ADD|nilai1, nilai2|Penjumlahan (operator +).
DIVIDE|dividen, pembagi|Pembagian (operator /).
EQ|nilai1, nilai2|Sama dengan (=).
GT|nilai1, nilai2|Lebih besar dari (>).
GTE|nilai1, nilai2|Lebih besar atau sama dengan (>=).
LT|nilai1, nilai2|Lebih kecil dari (<).
LTE|nilai1, nilai2|Lebih kecil atau sama dengan (<=).
MINUS|nilai1, nilai2|Pengurangan (operator -).
MULTIPLY|faktor1, faktor2|Perkalian (operator *).
NE|nilai1, nilai2|Tidak sama dengan (<>).
POW|basis, eksponen|Pangkat (operator ^).
UMINUS|nilai|Negasi angka.
UNARY_PERCENT|persen|Nilai dibagi 100.
UPLUS|nilai|Nilai apa adanya.
TO_DATE|nilai|Angka menjadi tanggal.
TO_DOLLARS|nilai|Angka menjadi mata uang.
TO_PERCENT|nilai|Angka menjadi persen.
TO_PURE_NUMBER|nilai|Menghapus format angka.
TO_TEXT|nilai|Nilai menjadi teks.
`,
};

export const DOCS = new Map();
for (const [cat, block] of Object.entries(RAW)) {
  for (const line of block.trim().split('\n')) {
    const [name, args, desc] = line.split('|');
    DOCS.set(name, { name, args, desc, cat });
  }
}
// fill in aliases and functions without explicit docs
for (const name of Object.keys(F)) {
  if (DOCS.has(name)) continue;
  const base = DOCS.get(name.replace(/^(.+?)(B|\.PRECISE)$/, '$1')) || DOCS.get(name.split('.')[0]) || null;
  DOCS.set(name, { name, args: base ? base.args : '…', desc: base ? base.desc : 'Fungsi kompatibel Excel/Sheets.', cat: base ? base.cat : 'Lainnya' });
}

export const CATEGORIES = [...new Set([...DOCS.values()].map(d => d.cat))];
export const allFunctions = () => [...DOCS.values()].filter(d => F[d.name]).sort((a, b) => a.name.localeCompare(b.name));
