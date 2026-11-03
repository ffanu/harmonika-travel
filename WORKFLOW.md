# WORKFLOW — Harmonika Travel

Dokumen ini memisahkan **apa yang benar-benar teramati** saat crawl, **apa yang dirancang**,
**apa yang sudah terimplementasi**, dan **integrasi yang belum tersedia**. Tujuannya agar
pembaca tidak menyamakan skeleton dengan aplikasi lengkap, dan tidak mengklaim kesetaraan
dengan Traveloka.

---

## 1. Fitur yang teramati pada crawl

Sumber: `web_blueprint` ke `https://www.traveloka.com/en-en`, tanpa sesi login.
Berkas bukti: `/Users/id/Downloads/harmonika-ai/document/blueprint-www.traveloka.com/BLUEPRINT.json`
dan `WORKFLOW.md` di direktori yang sama.

### 1.1 Batas crawl (wajib dibaca)

| Batas | Nilai |
| --- | --- |
| Halaman yang dijangkau | **30** (batas `max_pages` tool), **bukan** seluruh situs |
| API call teramati | **274** (hanya dicatat sebagai jejak; tidak ada yang dipanggil ulang atau dipakai) |
| Autentikasi | tidak ada sesi login, jadi tidak ada halaman akun/transaksi |
| Hasil halaman | banyak menghasilkan **konten kosong** karena render client-side dan anti-bot |
| CRUD privat | **tidak terverifikasi** |
| Alur transaksi & pembayaran | **tidak terverifikasi** |
| Endpoint API internal | tidak diakses; tidak ada API privat yang dipakai |

### 1.2 Path yang benar-benar terekam (30 halaman)

```
/en-en
/en-en/promotion
/en-en/download-app
/en-en/partnership
/en-en/retrieve/flight/forgot        # pencarian booking lewat kode referensi
/en-en/hotel
/en-en/flight
/en-en/airport-transfer
/en-en/car-rental
/en-en/activities
/en-en/cruise
/en-en/hotel/{indonesia,thailand,vietnam,malaysia,japan,philippines}
/en-en/hotel/united-states-of-america/<8 hotel>
/en-en/activities/united-states-of-america/product/<5 produk>
```

Pola yang dapat disimpulkan dari path di atas (dan yang **diadopsi** di aplikasi ini):
kategori sebagai segmen pertama, lalu negara/kota, lalu slug produk. Karena itu struktur
Harmonika Travel memakai `/flights`, `/hotels`, `/trips`, `/products/[slug]`.

### 1.3 Menu kategori yang terlihat

Hotel · Pesawat · Airport Transfer · Rental Mobil · Aktivitas · Cruise · Promo · Kemitraan ·
Pencarian booking (kode referensi).

### 1.4 Pola UI yang terlihat (umum di industri, bukan aset Traveloka)

- Navigasi kategori di header.
- Kotak pencarian utama: lokasi/tujuan, tanggal, jumlah tamu atau penumpang.
- Kartu destinasi dan kartu promo di beranda.
- Halaman hasil dengan filter harga dan pagination.
- Halaman detail produk dengan pilihan varian dan jadwal.

Yang **tidak** diambil: logo, gambar, ilustrasi, teks promosi, warna merek, nama produk,
harga, dan data inventori Traveloka. Semua aset dan isi di aplikasi ini dibuat sendiri atau
berupa data demo berlabel.

---

## 2. Fitur hasil rancangan

Dirancang untuk konteks bisnis Harmonika Travel, bukan meniru internal Traveloka:

1. **Enam kategori** dipetakan ke satu model data yang sama (`Product` + `Variant` + `Schedule`)
   sehingga penambahan kategori tidak memerlukan tabel baru.
2. **Harga dan ketersediaan otoritatif di server**: klien hanya memilih jadwal dan jumlah;
   total dihitung ulang di dalam transaksi.
3. **Idempotensi pemesanan** lewat `(userId, idempotencyKey)` untuk mencegah pesanan ganda
   saat pengguna menekan tombol berulang atau koneksi putus.
4. **Pembatalan sebagai permintaan** (`CANCELLATION_REQUESTED`), bukan pembatalan langsung,
   karena pengembalian dana butuh keputusan admin.
5. **RBAC dua peran** (`CUSTOMER`, `ADMIN`) dengan otorisasi per objek.
6. **Audit log** untuk setiap perubahan admin.
7. **Konten dan kemitraan** dikelola di basis data agar bisa diubah tanpa deploy.
8. **Penanda `isDemo`** pada produk dan booking supaya data uji tidak pernah tampak sebagai
   pesanan operasional.

---

## 3. Fitur yang terimplementasi

### 3.1 Katalog dan pencarian

| Fitur | Endpoint / halaman | Catatan |
| --- | --- | --- |
| Daftar + filter kategori, kata kunci, destinasi, tanggal, rentang harga, jumlah tamu | `GET /api/catalog` | Validasi `zod` ketat, pagination `page`/`limit` |
| Halaman kategori | `/flights`, `/hotels`, `/trips` | Server component membaca DB langsung |
| Detail produk | `/products/[slug]`, `GET /api/products/[slug]` | Menampilkan varian + jadwal tersisa |
| Promo aktif | `/promos` (`/promo` → 307) | Diperiksa ulang saat booking |
| Blog | `/blog`, `/blog/[slug]` | Dari tabel `Content` yang `published` |

### 3.2 Akun dan sesi

| Fitur | Endpoint |
| --- | --- |
| Registrasi | `POST /api/auth/register` |
| Login / logout | `POST /api/auth/login`, `POST /api/auth/logout` |
| Sesi aktif | `GET /api/auth/session` |
| Profil | `POST /api/auth/profile` (dipakai halaman akun) |

Registrasi selalu menjawab dengan pesan generik yang sama, sehingga penyerang tidak dapat
menebak email mana yang sudah terdaftar.

### 3.3 Pemesanan

| Fitur | Endpoint |
| --- | --- |
| Buat booking (validasi + harga server + cek ketersediaan transaksional) | `POST /api/bookings` |
| Daftar booking milik sendiri | `GET /api/bookings` |
| Detail + permintaan pembatalan | `GET`, `PATCH /api/bookings/[id]` |

### 3.4 Wishlist dan kemitraan

| Fitur | Endpoint |
| --- | --- |
| Wishlist tambah/hapus/daftar | `GET`, `POST`, `DELETE /api/wishlist` |
| Form kemitraan | `POST /api/partnerships` (status awal `NEW`) |

### 3.5 Admin (RBAC)

`/admin` plus endpoint `GET/POST/PATCH/DELETE` untuk `destinations`, `products`, `variants`,
`schedules`, `promos`, `contents`, `partnerships`, dan `bookings` (perubahan status).
Setiap perubahan menulis `AuditLog`.

### 3.6 Kualitas

`npm run lint` 0 error · `npm run typecheck` 0 error · `npm run build` sukses (25+ rute).

---

## 4. Integrasi yang belum tersedia

| Integrasi | Status | Alasan |
| --- | --- | --- |
| Payment gateway (Midtrans/Xendit/dll.) | **belum** | tidak ada kredensial; booking berhenti di `PENDING` |
| Penerbitan tiket/e-ticket | **belum** | butuh supplier dan format tiket resmi |
| Inventori supplier live (GDS, hotel API) | **belum** | tidak ada kontrak/kredensial |
| OAuth (Google/Apple) | **belum** | hanya email + password |
| Email transaksional (verifikasi, reset, invoice) | **belum** | tidak ada SMTP/penyedia email |
| Notifikasi WhatsApp/SMS | **belum** | tidak ada penyedia |
| Pencarian penerbangan real-time & multi-maskapai | **belum** | jadwal berasal dari tabel `Schedule` demo |
| Rekonsiliasi pembayaran & refund otomatis | **belum** | bergantung payment gateway |
| Mobile app | **belum** | rilis ini web saja |
| Program afiliasi dengan tracking | **belum** | halaman promo ada, pelacakan afiliasi tidak |

---

## 5. Alur kerja operasional

### 5.1 Pelanggan

1. Buka beranda atau halaman kategori → pilih produk.
2. Di halaman detail, pilih varian dan jadwal, tentukan jumlah, isi kontak.
3. Server memvalidasi, menghitung harga, dan memesan kursi dalam satu transaksi.
4. Booking muncul di `/bookings` dengan referensi `HT-...` dan status `PENDING`.
5. Pelanggan dapat mengajukan pembatalan; status menjadi `CANCELLATION_REQUESTED`.

### 5.2 Admin

1. Masuk dengan akun `role = ADMIN` → `/admin`.
2. Kelola destinasi → produk → varian → jadwal (urutan ini karena relasi `Restrict`).
3. Tinjau booking: `PENDING` → `CONFIRMED`/`CANCELLED`, atau proses pembatalan.
4. Tinjau form kemitraan (status `NEW` → ditindaklanjuti).
5. Publikasikan artikel blog lewat `contents`.

### 5.3 Deployment

1. Build lokal (`npm run build`) → arsip `.next/standalone`.
2. Unggah, ekstrak ke `/home/www.harmonikatravel.com/app`.
3. Tulis `.env` produksi (mode 600).
4. Terapkan migrasi (`prisma migrate deploy` atau SQL `0001_init`).
5. Jalankan `scripts/seed.mjs` bila katalog demo diperlukan.
6. `systemctl restart harmonikatravel` → cek `/api/health`.
7. `nginx -t && systemctl reload nginx`.

---

## 6. Keterbatasan yang harus disampaikan ke pemangku kepentingan

1. **Bukan klon fungsional Traveloka.** Ini aplikasi perjalanan dengan pola UI umum industri;
   tidak ada satu pun aset atau API Traveloka yang dipakai.
2. **Data katalog adalah demo.** Harga dan jadwal tidak mencerminkan pasar nyata.
3. **Tidak ada pembayaran.** Jangan memasarkan sebagai sistem yang bisa menerima uang
   sebelum payment gateway terpasang dan diuji.
4. **Crawl tidak lengkap.** 30 halaman, tanpa login; CRUD privat dan alur transaksi tidak
   terverifikasi sehingga tidak diklaim.
5. **Sertifikat TLS hanya untuk `www`.** Apex `harmonikatravel.com` belum tercakup sertifikat
   saat deploy ini; menambahkannya butuh penerbitan sertifikat baru.

## 7. Beranda baru: alur yang bisa diuji ulang

Bagian ini mencatat apa yang berubah pada beranda dan cara memverifikasinya.

### 7.1 Alur pengguna

1. Pengunjung membuka `/`. Hero menampilkan foto Mekkah, judul, dan subjudul.
2. Widget pencarian menawarkan 6 tab: Pesawat, Hotel, Umrah & Haji, Paket
   Wisata, Sewa Mobil, Aktivitas. Setiap tab menampilkan bidang yang relevan
   saja (tanggal pulang hanya untuk pesawat, jam sewa untuk mobil, dan
   seterusnya).
3. Menekan tombol CTA mengarahkan ke halaman kategori dengan parameter
   pencarian; hasil disaring **di server**.
4. Bila kata kunci atau tanggal tidak menghasilkan apa pun, halaman menampilkan
   keadaan kosong dengan tautan "Lihat semua pilihan", atau catatan bahwa yang
   ditampilkan adalah jadwal terdekat.
5. Kartu destinasi mengarah ke pencarian per kota; kartu produk mengarah ke
   halaman detail produk.

### 7.2 Pemeriksaan yang dijalankan pada rilis ini

| Pemeriksaan | Hasil |
| --- | --- |
| 11 rute utama (`/`, `/flights`, `/hotels`, `/trips`, `/promos`, `/blog`, `/login`, `/bookings`, `/wishlist`, `/partnership`, `/admin`) | semua HTTP 200 |
| Judul hero | `Perjalanan Nyaman, Aman, dan Penuh Makna` |
| Tab pencarian | 6, dengan bidang yang berbeda per tab |
| Trust bar | 5 butir, teks tidak terpotong |
| Carousel promo | 3 kartu, tombol sebelumnya/berikutnya, 3 indikator |
| Grid destinasi | 5 kartu (Mekkah, Madinah, Bali, Labuan Bajo, Tokyo) |
| Rail produk | 4 produk dari basis data |
| Gambar rusak | 0 |
| Pencarian `Madinah (MED)` + tanggal | 1 hasil, chip "Pencarian" dan "Tanggal" tampil |
| Tanggal tanpa jadwal | catatan jadwal terdekat tampil |
| Mobile 390 px | tanpa gulir horizontal, menu hamburger berisi 7 tautan |
| Error konsol | 0 (satu 401 `/api/wishlist` adalah perilaku lama saat belum login dan ditangani halaman) |

### 7.3 Batasan yang tetap berlaku

- Katalog masih data demo (`isDemo: true`); tidak ada pembayaran atau penerbitan
  tiket.
- Foto dibuat khusus untuk proyek ini, bukan aset Traveloka.
- `harmonikatravel.com` dan `www.harmonikatravel.com` sama-sama dilayani aplikasi ini.
