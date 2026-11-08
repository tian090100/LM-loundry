# LM Laundry

Versi awal aplikasi operasional satu cabang. Dibangun dengan React, TypeScript, Vinext, dan Cloudflare D1 melalui Sites. Login internal email–password dengan dua role: owner dan pegawai. Halaman login dapat diakses tanpa akun ChatGPT; data operasional memerlukan sesi aplikasi yang valid.

## Fitur

- Antrean pesanan berdasarkan estimasi selesai dan filter keterlambatan.
- Pesanan dengan beberapa layanan kg/pcs, diskon, biaya tambahan, paket, dan rak.
- Pembayaran awal/DP serta pelunasan berulang dengan riwayat waktu dan pencatat.
- Tahap produksi, jalur setrika saja, dan pengambilan setelah pembayaran lunas.
- Nota cetak / simpan PDF melalui dialog cetak browser; tautan WhatsApp membuka pesan untuk ditinjau dan dikirim manual.
- Riwayat pelanggan, pengeluaran, ringkasan kas harian, dan ekspor CSV.
- Data tersimpan di database server. Pesanan dan pembayaran awal disimpan atomik.
- Identitas permintaan mencegah transaksi ganda saat mengulang permintaan yang sama. Validasi nominal dan perhitungan harga dijalankan di server.

## Aturan sementara

Harga mengikuti 7 kategori dan 24 varian di foto menu toko; sumber katalog ada di `lib/domain.ts`. Belum ada editor harga atau minimum berat. Input kg sampai tiga desimal, subtotal dibulatkan ke rupiah terdekat. Pcs dan set wajib bilangan bulat. Laporan memakai hari WIB. Form estimasi menggunakan zona waktu perangkat, lalu disimpan sebagai UTC.

Produksi dicatat per pesanan. Order campuran mengikuti jalur lengkap; progres per item belum tersedia. Pengeluaran memakai waktu pencatatan. Ringkasan selisih kas bukan laba akuntansi.

## Menjalankan lokal

Node.js minimal 22.13. Jalankan `npm run install:ci` jika dependensi belum tersedia, `npm run db:generate` hanya saat mengubah skema, lalu `npm run build`.

Terapkan migrasi lokal yang belum diterapkan dengan:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_....sql
```

Ganti nama file dengan migrasi aktual. Jalankan `npm run dev`; buka alamat yang dicetak server. Konfigurasikan hash akun awal pada variabel `AUTH_BOOTSTRAP_USERS` di `.dev.vars` yang diabaikan Git, lalu masuk dengan akun aplikasi. Database lokal terpisah dari hosting.

## Pemeriksaan

```
node --experimental-strip-types --test tests/domain.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

## Batas versi awal

Katalog yang dapat diedit, koreksi/pembatalan order, refund, pengaturan printer thermal, dan WhatsApp otomatis belum tersedia. Konfirmasi aturan toko serta uji dengan data latihan sebelum dipakai untuk transaksi sebenarnya. Tidak ada pesanan contoh yang otomatis dimasukkan ke database hosting.

## Menu toko dari foto

Katalog sekarang berisi 7 kategori dan 24 varian harga dari foto menu toko. Pilihan durasi kilogram: Cuci + Setrika Wangi 3 hari/2 hari/1 hari/express 3 jam; Setrika Wangi dan Cuci Lipat Wangi 2 hari/1 hari/express 4 jam. Satuan lain menggunakan pcs atau set sesuai foto. Item sprei yang ditutup tidak dimasukkan.

Durasi layanan satuan tidak tercantum di foto, sehingga form meminta estimasi manual saat ada layanan tersebut. Order campuran dengan durasi yang diketahui menggunakan durasi terlama; estimasi tetap dapat diubah. Total, nama layanan, dan harga satuan pada order lama merupakan snapshot dan tidak mengikuti pembaruan katalog. Jalur Cuci Lipat melewati setrika, jalur Setrika Wangi melewati cuci/kering. Tidak ada perubahan skema database.



## Login dan hak akses

Owner dapat mengelola pesanan, pembayaran, pengeluaran, dan laporan. Pegawai dapat mengelola pesanan, pembayaran, progres, serta melihat layanan dan pelanggan, tetapi tidak mendapat data pengeluaran atau menu keuangan. Endpoint memeriksa role dari database pada setiap permintaan. Ringkasan kas disembunyikan untuk pegawai; nominal tagihan dan pembayaran setiap order tetap tersedia untuk pekerjaan kasir.

Akun awal diprovisikan dari secret runtime `AUTH_BOOTSTRAP_USERS`, berisi array dengan email, nama, role, salt, hash PBKDF2 SHA-256 100.000 iterasi. `scripts/hash-accounts.mjs` menyiapkan hash dari JSON kredensial melalui stdin tersembunyi. Tidak ada password awal di source atau migrasi. User yang sudah ada tidak ditimpa saat secret dibaca lagi. Untuk hosting, gunakan pengaturan environment Sites sebagai secret. Jangan menaruh data akun di hosting manifest atau Git.

Session memakai token acak 256 bit, hanya hash token disimpan di database; cookie HttpOnly, SameSite=Lax, Secure pada HTTPS, kedaluwarsa 12 jam. Logout menghapus sesi server. Fitur Ganti password meminta password saat ini dan mencabut semua sesi akun. Batas login memakai penghitung database per email dan IP selama 15 menit, dengan pesan gagal yang tidak membocorkan keberadaan akun. Belum tersedia reset password lewat email atau pendaftaran publik.

Tes tambahan: `node --experimental-strip-types --test tests/auth.test.mjs tests/domain.test.mjs`. Migration baru `drizzle/0001_foamy_vin_gonzales.sql` menambah tabel akun, sesi, dan pembatasan login tanpa mengubah order lama.


## Cetak dan unduh nota

Detail pesanan menyediakan tautan Cetak / PDF ke halaman `/receipt/[id]`. Halaman ini memerlukan sesi aplikasi yang aktif, merender nota dengan React, dan menyediakan tombol Cetak serta Unduh PDF. Tombol Cetak memakai dialog browser; browser di dalam aplikasi dapat tidak mendukung dialog tersebut. Gunakan Unduh PDF lalu buka file di Chrome, Safari, atau aplikasi PDF untuk mencetak.

PDF dibuat di server melalui `/api/receipts/[id]` menggunakan snapshot harga pesanan dan pembayaran terbaru. Format PDF lebar 80 mm dengan tinggi mengikuti isi. Font bawaan mendukung karakter Latin; karakter di luar cakupan font diganti dengan tanda tanya. Respons unduhan memakai autentikasi, no-store, nama file yang disanitasi, dan Content-Disposition attachment. Preview cetak HTML mengikuti pengaturan kertas pada printer/browser. Tidak ada integrasi Bluetooth langsung atau konfirmasi cetak fisik dari browser.
