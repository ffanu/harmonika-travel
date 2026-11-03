# WORKFLOW — Harmonika Travel

Dokumen kerja untuk produk **metasearch tiket** berbasis Travelpayouts. Ruang
lingkup dan alasan strategisnya ada di `ROADMAP.md`; berkas ini menjabarkan
**alur** yang harus berjalan.

Dokumen ini menggantikan versi lama yang disusun dari hasil crawl sebuah OTA.
Kesimpulannya waktu itu salah arah: kita meniru alur pemesanan (inventori,
kursi, pembayaran) padahal Travelpayouts tidak menyediakan itu. Yang kita punya
adalah **data harga + tautan afiliasi**, jadi alur intinya adalah pencarian dan
perbandingan, bukan transaksi.

## 1. Alur pengguna utama

```
Beranda
  -> form pencarian (asal, tujuan, tanggal, penumpang, kelas)
  -> halaman hasil: DAFTAR tawaran
       -> urutkan (termurah / tercepat / berangkat awal)
       -> filter (langsung/transit, maskapai, harga maks)
       -> lihat tanggal lain yang lebih murah (kalender)
       -> klik "Pilih" -> Aviasales (marker afiliasi) -> transaksi di mitra
```

Detail yang wajib benar:

1. **Beranda** memuat form + rute populer + harga mitra terbaru. Tidak ada
   tombol yang menjanjikan pemesanan di situs kita.
2. **Form** mengirim `GET /flights?from=CGK&to=MED&date=2026-11-13&pax=1&cabin=economy`.
   Tanpa JavaScript tetap berfungsi (form GET biasa).
3. **Halaman hasil** menampilkan daftar baris, bukan grid kartu besar. Setiap
   baris memuat: kode+nama maskapai, jam berangkat -> jam tiba, durasi, jumlah
   transit, partner penjual, harga, tombol Pilih.
4. **Filter dan urutan** disimpan di URL (`sort`, `stops`, `airline`, `max`),
   dihitung di server, sehingga hasil bisa dibagikan dan di-cache.
5. **Kalender** menampilkan tanggal lain pada bulan yang sama beserta harga
   termurah; klik tanggal = pencarian ulang dengan tanggal itu.
6. **Keadaan kosong** menjelaskan sebabnya (rute tanpa data / tanggal tanpa
   jadwal) dan menawarkan rute populer, bukan halaman putih.

## 2. Alur data

```
Travelpayouts API (server, token dari .env)
  -> normalisasi ke FlightOffer (tipe tunggal)
  -> cache Next.js (revalidate 300-900 detik)
  -> filter + urutan dari query string
  -> render server (HTML awal berisi daftar, ramah SEO)
  -> klik keluar: deep link Aviasales + marker 595040
```

Aturan:

- Token **hanya** dibaca di server (`process.env`). Diuji: 0 kemunculan di HTML
  maupun di respons `/api/deals`.
- Satu sumber gagal tidak menggagalkan halaman: `Promise.allSettled`, lalu
  fallback ke sumber kedua (`nearest-places-matrix` -> `prices/cheap`).
- Urutan fallback bila tanggal tidak diisi: pakai kalender/harga terbaru dan
  beri tahu pengguna bahwa harga adalah tanggal terdekat yang tersedia.

## 3. Yang diarsipkan dan kenapa

| Fitur lama | Status | Alasan |
| --- | --- | --- |
| Katalog inventori + varian + jadwal | arsip, tidak ditautkan | bukan milik kita; tidak bisa dijual |
| "Buat pesanan demo" | arsip | transaksi terjadi di mitra |
| Halaman pesanan/wishlist sebagai alur utama | turun prioritas | butuh inventori |
| Harga kamar hotel internal | dihapus | API harga hotel 404 untuk token ini |
| Struktur URL hasil crawl OTA | diganti | bukan kebutuhan kita |

Kode lama tidak dihapus dari repositori agar riwayat dan pengujiannya tetap
jujur, tetapi navigasi utama tidak lagi menuju ke sana.

## 3b. Halaman rute (Fase 2) — sudah berjalan

| URL | Isi |
| --- | --- |
| `/flights/cgk-med` | h1 rute, harga termurah, tabel harga per bulan (klik -> pencarian bertanggal), strip 14 tanggal, 5 tawaran dengan tombol Pilih, rute terkait, 3 FAQ + JSON-LD |
| `/flights?origin=SUB` | rute populer dari kota asal terpilih + 10 kartu menuju halaman rute |
| `/sitemap.xml` | 70 URL (7 statis + 63 rute dari 5 origin) |
| `/robots.txt` | allow `/`, disallow `/admin`, `/api/`, `/bookings`, `/wishlist`, `/login` |

Catatan implementasi:

- Harga per bulan berasal dari **satu** permintaan `prices/latest?limit=30` yang
  dikelompokkan per bulan di server (bukan 12 permintaan).
- `sitemap.ts` wajib `dynamic = "force-dynamic"`: bila dirender saat build, token
  belum ada dan daftar rute kosong ikut ter-cache (pernah terjadi: 0 rute).
- Slug divalidasi `^[a-z]{3}-[a-z]{3}$`; selain itu `notFound()`.

## 4. Alur konten & SEO

- Satu artikel per rute/topik (mis. "Tiket Jakarta–Madinah termurah"), memuat
  harga acuan dari API + tautan pencarian bertanggal.
- Halaman rute (`/flights/cgk-med`) menjadi pintu masuk organik; artikel
  menautkannya.
- Semua tautan keluar `rel="noopener noreferrer nofollow sponsored"`.
- Tidak menyalin teks/desain pihak lain; foto dibuat sendiri (`public/images`).

## 5. Alur rilis

```bash
npm run lint && npx tsc --noEmit && npm run build
node scripts/images-to-webp.mjs            # bila aset berubah
tar czf /tmp/harmonika-travel-standalone.tgz \
  --exclude='.next/standalone/public/images/*.png' \
  .next/standalone prisma scripts/*.mjs
# unggah, ekstrak, jaga .env, restart harmonikatravel.service
```

Verifikasi wajib setelah deploy:

| Cek | Cara | Ambang |
| --- | --- | --- |
| Health | `curl 127.0.0.1:3401/api/health` | 200 |
| Pencarian | `/flights?from=CGK&to=MED&date=…` | >= 3 tawaran |
| Filter | `&stops=0` | hasil hanya tanpa transit |
| Deep link | klik baris pertama | mendarat di aviasales 200 |
| Token | `grep` di HTML/JSON | 0 kemunculan |
| Mobile 390 px | Playwright | 0 overflow |
| Konsol | Playwright | 0 error |

## 6. Jebakan yang sudah memakan waktu

1. `emrldtp.com` membalas **403** untuk klien tanpa User-Agent/Referer wajar.
   Uji Drive dengan browser, bukan `curl` polos.
2. Next.js menjalankan inline script dua kali (antrean awal + hidrasi). Drive
   perlu penjaga `window.__harmonikaTpDrive`, kalau tidak entrypoint termuat 2x.
3. `nearest-places-matrix` membatasi `limit` maksimum **7** (`limit: too big`).
4. `engine.hotellook.com/api/v2/*` **404** -> jangan bangun UI harga hotel.
5. `/v1/airlines` tidak ada -> nama maskapai dipetakan lokal dari kode IATA.
6. `npm ci` pernah gagal karena lock tidak sinkron (ajv 6 vs 8); lock sudah
   disinkronkan dan build dari clone bersih diverifikasi.
7. `sitemap.ts` yang dirender saat build menghasilkan 0 rute karena token belum
   tersedia; gunakan `export const dynamic = "force-dynamic"`.
8. **Jangan mengemas tarball sebelum `next build` benar-benar selesai.** Baris
   "Compiled successfully" muncul lebih awal; `.next/standalone` masih ditulis
   setelahnya. Gejalanya: deploy sukses, service aktif, tetapi halaman masih
   memuat kode lama. Selalu periksa `cat .next/BUILD_ID` dan `grep` string baru
   di `.next/standalone` sebelum `tar`, lalu verifikasi string itu di server
   setelah ekstrak (lihat contoh di §5).
