# ROADMAP — Harmonika Travel

Dokumen ini mengunci **apa yang kita bangun dan apa yang sengaja tidak**. Aturan
utamanya satu kalimat:

> Kalau Travelpayouts tidak menyediakannya, Harmonika Travel tidak mengada-nya.

Alasannya praktis: kita tidak punya supplier, kontrak maskapai, atau lisensi
hotel. Travelpayouts memberi **data harga + tautan afiliasi**, bukan inventori.
Jadi produk kita adalah **metasearch/afiliasi**: pengguna mencari, kita tampilkan
dan bandingkan, transaksi selesai di situs mitra (Aviasales, Hotellook, dan
program lain yang aktif di akun).

## 1. Bukti kapabilitas (diuji 2026-11-03 dengan token akun ini)

| Kapabilitas | Endpoint | Status | Dipakai untuk |
| --- | --- | --- | --- |
| Daftar tawaran tiket (maskapai, jam, durasi, transit, partner, harga, deep link) | `GET /v2/prices/nearest-places-matrix` | **200**, 5–7 tawaran/permintaan | **daftar hasil pencarian** |
| Harga per bulan + nomor penerbangan | `GET /v1/prices/cheap` | **200** | cadangan bila matrix kosong |
| Kalender tanggal termurah | `GET /v1/prices/calendar` | **200** | strip "tanggal lebih murah" |
| Harga terbaru agregat | `GET /v2/prices/latest` | **200** | kartu "harga mitra" di beranda |
| Rute populer per kota asal | `GET /v1/city-directions` | **200**, 30 rute | bagian "rute populer" |
| Matriks bulan/tanggal | `GET /v2/prices/month-matrix`, `/week-matrix` | **200** (week bisa kosong) | riset harga |
| Deep link penerbangan | `aviasales.com/search/{FROM}{DDMM}{TO}1?marker=…` | **200** | tombol "Pilih" |
| Deep link hotel | `search.hotellook.com/hotels?location=…&marker=…` | **302 → 200** | band hotel |
| Harga kamar hotel (API) | `engine.hotellook.com/api/v2/*` | **404** | **tidak dipakai** |
| Nama maskapai (referensi) | `/v1/airlines`, `/v2/reference/airlines` | **404** | diganti tabel kode lokal |
| Drive (skrip di browser) | `emrldtp.com/NTk1MDQw.js` | **200**, project aktif | monetisasi tautan keluar |

Konsekuensi yang harus diterima: **tidak ada** harga kamar langsung, **tidak ada**
kursi/seat map, **tidak ada** pembayaran.

## 2. Ruang lingkup

### Termasuk (didukung Travelpayouts)
- Pencarian tiket pesawat → **daftar tawaran** dengan filter & urutan.
- Kalender tanggal termurah per rute.
- Rute populer dari kota asal.
- Halaman detail rute (`/flights/CGK-MED`) untuk SEO + tautan afiliasi.
- Tautan hotel/aktivitas/transfer ke mitra (tanpa harga sendiri).
- Konten pendukung: artikel rute, panduan, promo mitra.
- Akun: hanya untuk menyimpan pencarian/wishlist di sisi kita (opsional, fase 4).

### Tidak termasuk (tidak didukung Travelpayouts)
- Katalog inventori sendiri, ketersediaan kursi, dan **mesin booking sendiri** →
  **diarsipkan**; tidak ada lagi tombol "Buat pesanan demo" sebagai alur utama.
- Pembayaran, invoice, refund, tiket terbit, e-ticket.
- Manajemen pesanan/PNR, check-in, perubahan jadwal.
- Harga kamar hotel real-time.
- Data pelanggan di luar kebutuhan akun sendiri.

### Dipertahankan
- Kode katalog & booking lama tetap ada di repo (tidak dihapus) sebagai arsip
  teknis, tetapi **tidak ditautkan** dari navigasi utama dan tidak dipromosikan.

## 3. Fase pekerjaan

### Fase 1 — Pencarian berbentuk daftar (prioritas sekarang)
Kenapa: halaman `/flights` saat ini hanya menampilkan kartu katalog demo, bukan
daftar tawaran. Ini kesenjangan terbesar dibanding situs tiket besar.

- Form pencarian ringkas: asal, tujuan, tanggal, penumpang, kelas (`GET`, tanpa JS).
- Hasil: daftar baris per tawaran — maskapai, jam berangkat → tiba, durasi,
  transit, partner penjual, harga, tombol **Pilih** (deep link).
- Urutan: termurah / tercepat / berangkat paling awal.
- Filter: langsung vs transit, maskapai, harga maksimum.
- Strip kalender: tanggal lain yang lebih murah (dari `prices/calendar`).
- Keadaan kosong & gagal: jelaskan dan tawarkan rute populer.
- Kriteria selesai: rute CGK→MED menampilkan ≥3 tawaran; filter mengubah hasil;
  tiap baris membuka Aviasales dengan marker kita.

### Fase 2 — Halaman rute & SEO
- `/flights/[from]-[to]` (mis. `/flights/cgk-med`): ringkasan rute, harga
  termurah per bulan, maskapai yang melayani, FAQ, tautan ke pencarian bertanggal.
- Sitemap dinamis dari rute populer + artikel.
- Metadata & JSON-LD (`Product`/`Offer` tidak dipakai; gunakan `ItemList`).

### Fase 3 — Hotel & produk lain sebagai tautan
- Karena API harga hotel 404, halaman hotel menjadi **panduan + tautan Hotellook**
  per kota, bukan daftar harga palsu.
- Program lain dari akun Anda (25 brand terdaftar) ditambahkan satu per satu
  setelah diuji 200.

### Fase 4 — Retensi
- Simpan pencarian terakhir & wishlist rute (akun kita sendiri).
- Notifikasi harga via email/Telegram bila nanti ada sumber data yang sah.

### Fase 5 — Operasional
- Dashboard internal: kesehatan API mitra, jumlah klik keluar, rute tanpa hasil.
- Pantau kuota token; cache 5–15 menit agar tidak boros.

## 4. Metrik keberhasilan

| Metrik | Target awal |
| --- | --- |
| Rute dengan ≥1 tawaran | > 80% rute populer |
| Waktu render daftar hasil (server) | < 2 s (cache hangat) |
| Klik keluar per sesi pencarian | ≥ 1 |
| Halaman hasil kosong | < 10% permintaan |
| Error 5xx pada `/flights` | 0 |

## 5. Prinsip teknis

1. **Token hanya di server.** Tidak pernah muncul di HTML, JS bundle, atau
   respons JSON publik (sudah diuji: 0 kemunculan).
2. **Gagal dengan tenang.** Timeout 8 s, cache 5–15 menit, satu rute gagal tidak
   menjatuhkan halaman.
3. **Jangan mengarang data.** Tidak ada harga, kursi, atau rating yang tidak
   berasal dari mitra atau dari konten yang kita tulis sendiri.
4. **Label jelas.** Bagian "harga mitra" dipisahkan dari konten editorial.
5. **Tautan keluar** selalu `rel="noopener noreferrer nofollow sponsored"` +
   `target="_blank"` + `marker` afiliasi.