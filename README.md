# LM Laundry

Versi awal aplikasi operasional satu cabang. Dibangun dengan React, TypeScript, Vinext, dan Cloudflare D1 melalui Sites. Hosting privat untuk owner; akses pegawai belum diimplementasikan.

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

Ganti nama file dengan migrasi aktual. Jalankan `npm run dev`; buka alamat yang dicetak server. Masuk melalui tombol ChatGPT memakai identitas simulasi lokal. Database lokal terpisah dari hosting.

## Pemeriksaan

```
node --experimental-strip-types --test tests/domain.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

## Batas versi awal

Akses pegawai/role, katalog yang dapat diedit, koreksi/pembatalan order, refund, pengaturan printer thermal, dan WhatsApp otomatis belum tersedia. Konfirmasi aturan toko serta uji dengan data latihan sebelum dipakai untuk transaksi sebenarnya. Tidak ada pesanan contoh yang otomatis dimasukkan ke database hosting.

## Menu toko dari foto

Katalog sekarang berisi 7 kategori dan 24 varian harga dari foto menu toko. Pilihan durasi kilogram: Cuci + Setrika Wangi 3 hari/2 hari/1 hari/express 3 jam; Setrika Wangi dan Cuci Lipat Wangi 2 hari/1 hari/express 4 jam. Satuan lain menggunakan pcs atau set sesuai foto. Item sprei yang ditutup tidak dimasukkan.

Durasi layanan satuan tidak tercantum di foto, sehingga form meminta estimasi manual saat ada layanan tersebut. Order campuran dengan durasi yang diketahui menggunakan durasi terlama; estimasi tetap dapat diubah. Total, nama layanan, dan harga satuan pada order lama merupakan snapshot dan tidak mengikuti pembaruan katalog. Jalur Cuci Lipat melewati setrika, jalur Setrika Wangi melewati cuci/kering. Tidak ada perubahan skema database.

