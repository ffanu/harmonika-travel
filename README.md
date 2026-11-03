# Harmonika Travel

Aplikasi full-stack perjalanan untuk **www.harmonikatravel.com**: katalog enam kategori,
pencarian dan filter, pemesanan dengan harga dihitung server, akun pelanggan, wishlist,
promo, kemitraan, blog, dan panel admin dengan RBAC.

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL**.
Bahasa antarmuka: Indonesia. Mata uang: IDR.

## Status (jujur, per rilis ini)

| Aspek | Status |
| --- | --- |
| Source code | lengkap, lint 0 error, `tsc --noEmit` 0 error, `next build` sukses |
| Database | PostgreSQL produksi, 14 tabel, migrasi `0001_init` tercatat di `_prisma_migrations` |
| Deploy | **live** di `https://www.harmonikatravel.com` dan `https://harmonikatravel.com` (systemd `harmonikatravel.service`, loopback 3401, reverse proxy nginx, sertifikat mencakup kedua nama) |
| Data katalog | **demo** (`isDemo = true`), bukan inventori nyata |
| Pembayaran | **tidak ada** payment gateway; booking tetap `PENDING`, tidak pernah ditandai lunas |
| Tiket nyata | tidak diterbitkan |
| Integrasi supplier | tidak tersedia (tidak ada kredensial) |
| Kesetaraan fitur Traveloka | **tidak diklaim**; lihat `WORKFLOW.md` bagian keterbatasan |

## Arah produk (baca ini dulu)

Harmonika Travel adalah **metasearch/afiliasi**, bukan OTA: kita menampilkan dan
membandingkan tawaran mitra, transaksi selesai di situs mitra. Karena itu
**hanya fitur yang didukung Travelpayouts** yang dibangun. Ruang lingkup lengkap,
matriks kapabilitas yang sudah diuji, dan fase pekerjaan ada di **`ROADMAP.md`**;
alur teknis dan jebakannya di **`WORKFLOW.md`**.

Kode katalog/booking lama masih ada di repo sebagai arsip teknis, tetapi bukan
lagi alur utama dan tidak ditautkan dari navigasi.

## Pencarian tiket (bentuk daftar)

`/flights` menampilkan **daftar tawaran**, bukan kartu katalog:

| Bagian | Isi |
| --- | --- |
| Tanpa asal/tujuan | form pencarian + 10 rute populer berharga (dari `city-directions`) |
| Dengan asal/tujuan | baris tawaran: maskapai, jam berangkat → tiba, durasi, transit, penjual, harga, tombol **Pilih** |
| Urutan | `sort=price` (default), `sort=duration`, `sort=depart` |
| Filter | `stops=0`/`1`, `airline=XX`, `max=2000000` |
| Tanggal lain | strip tanggal + harga dari `prices/calendar` |
| Tanpa hasil | penjelasan + saran rute populer |

Contoh: `/flights?from=CGK&to=DPS&sort=duration&stops=0`.

Sumber data: `nearest-places-matrix` (kaya: partner, jam, deep link) digabung
`prices/cheap` (variasi maskapai per jumlah transit), di-dedupe, maksimum 12
baris. Harga hotel belum tersedia (API mitra 404), jadi `/hotels` masih memakai
tautan pencarian Hotellook.

## Struktur URL

| Alamat | Fungsi |
| --- | --- |
| `/` | Beranda + pencarian katalog (client component memanggil `/api/catalog`) |
| `/flights` | Katalog kategori FLIGHT |
| `/hotels` | Katalog kategori HOTEL |
| `/trips` | Paket: ACTIVITY, AIRPORT_TRANSFER, CAR_RENTAL, CRUISE |
| `/promos` | Promo aktif (`/promo` alias 307 ke sini) |
| `/blog`, `/blog/[slug]` | Artikel dari tabel `Content` |
| `/products/[slug]` | Detail produk, varian, jadwal, form pemesanan |
| `/login` | Daftar / masuk |
| `/bookings` | Pesanan milik sendiri, detail, permintaan pembatalan |
| `/wishlist` | Produk tersimpan |
| `/partnership` | Form kemitraan untuk ditinjau admin |
| `/admin` | Panel admin (RBAC `role = ADMIN`) |
| `/api/health` | Health check `{"ok":true}` |

## Menjalankan lokal

```bash
cp .env.example .env          # isi DATABASE_URL + APP_ORIGIN
npm install
npm run db:generate
npm run db:migrate            # atau: prisma migrate deploy
npm run typecheck && npm run lint && npm run build
npm run dev
```

`npm start` menjalankan `.next/standalone/server.js`; `scripts/harmonika-serve.mjs` menolak
port 3000 dan memeriksa readiness lewat `/api/health`, bukan hanya bind port.

## Admin pertama

Tidak ada password default. Buat dari environment:

```bash
SEED_ADMIN_EMAIL="admin@example.com" \
SEED_ADMIN_PASSWORD="<minimal 12 karakter>" \
node scripts/seed.mjs
```

Idempoten: menjalankan ulang memperbarui password admin dan menyegarkan katalog demo
(6 destinasi, 10 produk, 38 jadwal, promo `DEMO10`, 1 artikel).

## Variabel environment

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | `postgresql://user:pass@host:5432/db?schema=public` |
| `APP_ORIGIN` | ya | Origin yang diizinkan untuk mutasi, mis. `https://www.harmonikatravel.com` |
| `NODE_ENV` | produksi | `production` mengaktifkan cookie `__Host-` + `Secure` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | hanya seed | dipakai `scripts/seed.mjs`, tidak dibaca runtime |
| `PORT` / `HOSTNAME` | deploy | produksi: `3401` dan `127.0.0.1` |

Rahasia produksi berada di `/home/www.harmonikatravel.com/app/.next/standalone/.env`
(mode `600`, milik `www-data`) dan **tidak** ada di repositori.

## Keamanan yang diterapkan

- Password: `scrypt` (salt 16 byte, key 64 byte), minimal 12 karakter.
- Sesi: token 32 byte acak disimpan sebagai hash SHA-256; cookie `HttpOnly` + `Secure`
  (`__Host-` di produksi) + `SameSite=Lax`, berlaku 7 hari.
- Mutasi: `assertOrigin` membandingkan header `Origin` dengan `APP_ORIGIN`; body wajib
  `application/json`, maksimal 32 KB.
- Rate limit autentikasi: tabel `RateLimit` per email + IP.
- Validasi input: skema `zod` `.strict()` di setiap endpoint.
- Query terparameterisasi: Prisma client, termasuk `$queryRaw` bertemplate.
- Otorisasi per objek: `bookings/[id]` memfilter `userId`; akses silang → **404**.
- RBAC admin: `requireAdmin`; pengguna biasa → **403**.
- Harga & ketersediaan dihitung dalam transaksi server; nilai harga dari klien ditolak.
- Idempotensi booking: unik `(userId, idempotencyKey)`; pengulangan mengembalikan referensi sama.
- Audit perubahan admin: tabel `AuditLog`.

## Verifikasi yang sudah dijalankan

Terhadap domain produksi, memakai akun uji yang dibuat saat pengujian:

| Uji | Hasil |
| --- | --- |
| Registrasi + login pelanggan | 200 / 200 |
| Booking 2 kursi | 201 `HT-...`, total `1.780.000` dihitung server |
| Pengulangan `idempotencyKey` sama | 201 dengan **referensi identik**, tanpa duplikat |
| Booking 999 kursi | 400 ditolak |
| Menyisipkan `totalIdr`/`unitPriceIdr` dari klien | 400 ditolak |
| Pelanggan akses `/api/admin/bookings` | 403 |
| Pelanggan B akses booking pelanggan A | 404; daftar B kosong |
| Login admin + 3 endpoint admin | 200 |
| Password salah | 401 |
| Semua halaman utama | 200 (`/promo` → 307) |

## Deployment saat ini

```
/home/www.harmonikatravel.com/app/.next/standalone   # server.js + node_modules + .env
systemd: harmonikatravel.service (User=www-data, PORT=3401, 127.0.0.1, MemoryMax=1G)
nginx:   sites-available/www.harmonikatravel.com.conf -> proxy_pass 127.0.0.1:3401 (server_name: www + apex)
db:      www_harmonikatravel_com (PostgreSQL 14, user pocong)
```

Backup sebelum penggantian: `/root/harmonika-travel-backup-<timestamp>/`
(berisi vhost lama, `public_html` lama, dan dump DB saat masih kosong).

### Rollback

```bash
systemctl stop harmonikatravel
cp /root/harmonika-travel-backup-*/www.harmonikatravel.com.conf \
   /etc/nginx/sites-available/www.harmonikatravel.com.conf
nginx -t && systemctl reload nginx      # kembali ke halaman statis lama
```

## Lisensi & atribusi

Kode ditulis mandiri untuk Harmonika Travel. Tidak ada aset, logo, teks, atau API privat
Traveloka yang disalin. Lihat `TEMPLATE-PROVENANCE.json` untuk komponen pihak ketiga
(shadcn/ui, Radix, Lucide, dst.) beserta lisensinya.

## Deploy ulang

`scripts/deploy.sh` menjalankan build → paket → unggah → ekstrak → restart → cek health.
`.env` produksi di server **dipertahankan** (tidak ditimpa); skrip berhenti dengan peringatan
bila file itu belum ada.

```bash
SSH_HOST=103.157.24.189 SSH_PORT=2016 SSH_USER=root \
APP_DIR=/home/www.harmonikatravel.com/app \
./scripts/deploy.sh
```

## Catatan pengujian UI

Smoke test browser dijalankan dengan matriks 5 profil (desktop 1440, desktop gelap 1280,
tablet 834, mobile 390, mobile kecil 360). Hasil akhir: **13/13 cek lolos, 0 error konsol,
0 request gagal**. Cek yang dijalankan: overflow horizontal, overflow widget, meta viewport,
`lang`, judul dokumen, satu `h1`, `alt` gambar, gambar termuat, input berlabel, id duplikat,
kontras teks (WCAG AA, warna `lab()`/`color(srgb)` dinormalkan), ukuran teks, dan tap target
minimum 24px.

## Desain beranda (mengikuti mockup)

Beranda dibangun ulang mengikuti mockup yang diberikan pemilik produk. Semua
teks, warna, dan gambar berada di repositori ini; tidak ada aset milik pihak
lain yang disalin.

| Bagian | Berkas |
| --- | --- |
| Header lengket + wordmark + menu seluler | `src/components/site-header.tsx`, `src/components/brand-logo.tsx` |
| Hero foto + judul + subjudul | `src/app/page.tsx`, `public/images/hero-mecca.webp` |
| Widget pencarian 6 tab yang benar-benar mengarahkan ke katalog | `src/components/search-widget.tsx` |
| Trust bar 5 butir | `src/components/trust-bar.tsx` |
| Carousel promo (geser, tombol, indikator) | `src/components/promo-carousel.tsx` |
| Grid "Destinasi Populer" | `src/components/destination-grid.tsx` |
| Rail produk dari basis data | `src/components/product-rail.tsx` |
| Footer gelap + kontak WhatsApp | `src/components/site-footer.tsx` |
| Isi teks/tautan/opsi | `src/lib/home-content.ts` |

Token warna brand ada di `src/app/globals.css` (`--color-brand`, `--color-sun`,
`--color-ink`, `--color-mist`, `--color-hairline`).

### Gambar

Sembilan foto dibuat khusus untuk proyek ini (hero Mekkah, tiga kartu promo,
lima destinasi) ditambah empat foto kategori (kamar hotel, mobil transfer,
Jakarta, Singapura). Sumber PNG disimpan di `public/images/`; versi WebP
dihasilkan oleh:

```bash
node scripts/images-to-webp.mjs
```

Halaman memakai berkas WebP (total ~470 KB untuk 13 gambar). PNG tidak perlu
diunggah ke server: `scripts/deploy.sh` mengecualikannya dari arsip.

### Pencarian

Widget mengirim pengguna ke halaman kategori dengan parameter `q`, `date`,
`return`, dan `pax`. Halaman `/flights`, `/hotels`, dan `/trips` membaca
parameter itu di server (bukan difilter di browser) melalui `searchCategory()`
di `src/components/category-catalog.tsx`.

Dua perilaku yang disengaja:

1. Kata kunci dari pemilih bandara (mis. `Madinah (MED)`) dicari dalam bentuk
   utuh **dan** tanpa kode bandara, sehingga cocok dengan nama produk.
2. Bila tanggal yang diminta tidak punya jadwal, hasil tanpa filter tanggal
   dikembalikan bersama catatan bahwa yang tampil adalah jadwal terdekat.

### Menambah katalog tanpa menyentuh akun

`scripts/seed.mjs` membuat admin + katalog. Untuk menambah/menyegarkan katalog
saja (mis. rute Arab Saudi dan paket Umrah) gunakan:

```bash
cd .next/standalone && set -a && . ./.env && set +a && node seed-catalog.mjs
```

Katalog bersama berada di `scripts/catalog-data.mjs`; setiap entri ditandai
`isDemo` sehingga pengunjung tahu itu data contoh.

## Integrasi afiliasi: Travelpayouts Drive

Script Drive dari dasbor Travelpayouts (partner ID `595040`) dipasang di
`src/app/layout.tsx` lewat `next/script` dengan `strategy="beforeInteractive"`,
sehingga ikut terkirim pada HTML awal dan berlaku di **setiap halaman**
(root layout).

Alamat berkas: `https://emrldtp.com/NTk1MDQw.js?t=595040`.

Dua hal yang sengaja ditambahkan di luar potongan kode asli dasbor:

1. **Penjaga idempoten** `window.__harmonikaTpDrive`. Next.js menjalankan inline
   script ini dari antrean awal **dan** sekali lagi saat hidrasi; tanpa penjaga,
   berkas Travelpayouts dimuat dua kali per halaman (terukur: 2x sebelum
   perbaikan, 1x sesudahnya).
2. **`data-cfasync="false"`** agar Cloudflare Rocket Loader tidak menunda
   eksekusinya (situs ini di belakang Cloudflare).

### Cara memverifikasi

Jangan uji dengan `curl` polos: WAF `emrldtp.com` membalas **403** untuk klien
 tanpa User-Agent/Referer normal. Gunakan browser (atau `curl` dengan UA +
`Referer`). Penanda berhasil:

- `document.getElementById('travelpayouts-drive')` ada di `<head>`;
- Network memuat `NTk1MDQw.js` **satu kali**, lalu `chunk.RgDlCtYM.js` dan
  beberapa chunk lain (total ~209 KB);
- `GET https://emrldtp.com/entrypoint_config?...&t=595040` membalas **200**
  dengan `access-control-allow-origin: *`;
- Console menulis `[tp] entrypoint init` tanpa error;
- `window.TPAM_SCRIPT_HASH` dan `window.TPAM_GET_ERRORS` tersedia.

Respons `entrypoint_config` juga mengonfirmasi project: `trs: 595040`,
`domain: www.harmonikatravel.com`. Apex (`harmonikatravel.com`) dilayani project
yang sama, sehingga tidak perlu pemasangan terpisah.

### Catatan privasi

Drive memasang cookie/token afiliasi setelah interaksi pengguna. Atribut
`data-cmp-ab="2"` dipertahankan agar script menghormati CMP bila nanti
dipasang. Bila Anda mengaktifkan banner consent, uji ulang dengan banner
menolak: script seharusnya tidak boleh menulis cookie sebelum izin.

## Harga mitra: Travelpayouts API

Selain Drive (skrip di browser), situs memakai **API Travelpayouts** dari sisi
server untuk menampilkan harga tiket nyata dan tautan afiliasi.

| Item | Nilai |
| --- | --- |
| Kode | `src/lib/travelpayouts.ts` |
| Tampilan | `src/components/deal-rail.tsx` (`DealRail`, `HotelAffiliateBand`) |
| Dipakai di | `/flights` (harga tiket), `/hotels` (band hotel) |
| Endpoint cek | `GET /api/deals` |
| Env | `TRAVELPAYOUTS_TOKEN`, `TRAVELPAYOUTS_MARKER` |

### Perilaku

- Token hanya dibaca di server (`process.env`) dan **tidak pernah** dikirim ke
  browser: sudah diuji, string token 0 kemunculan di HTML `/flights` maupun di
  respons `/api/deals`.
- Permintaan memakai `revalidate: 900` (15 menit) dan batas waktu 8 detik.
- Satu rute gagal tidak menggagalkan rute lain (`Promise.allSettled`). Bila
  semua gagal, halaman menampilkan catatan "harga mitra sedang tidak dapat
  dimuat" dan katalog demo tetap bisa dipakai.
- Harga diambil per destinasi (harga termurah), supaya rute mahal seperti
  Madinah/Jeddah tetap tampil, tidak tertutup rute murah seperti Denpasar.
- Tautan keluar memakai `rel="noopener noreferrer nofollow sponsored"` dan
  `target="_blank"`, dengan `marker=595040` serta `currency=idr`.

### Format tautan afiliasi

| Tujuan | Format |
| --- | --- |
| Penerbangan | `https://www.aviasales.com/search/{ORIGIN}{DDMM}{DEST}1?marker=595040` |
| Hotel | `https://search.hotellook.com/hotels?location={Kota}&adults=2&currency=idr&marker=595040` |

Format `{ORIGIN}{DDMM}{DEST}{PAX}` diverifikasi menghasilkan HTTP 200 di
Aviasales. Format `/flights/CGK-MED` **tidak** valid (404), jadi jangan dipakai.

### Yang belum tersedia

Hotellook API v2 (`engine.hotellook.com/api/v2/*`) membalas 404 untuk token ini,
jadi harga kamar belum bisa ditampilkan langsung. Yang dipakai adalah tautan
pencarian Hotellook. Bila program hotel diaktifkan di dasbor, endpoint itu bisa
mulai bekerja; uji ulang sebelum mengandalkannya.

### Mengganti token

```bash
ssh -p 2016 root@103.157.24.189
nano /home/www.harmonikatravel.com/app/.next/standalone/.env   # ganti TRAVELPAYOUTS_TOKEN
chmod 600 /home/www.harmonikatravel.com/app/.next/standalone/.env
systemctl restart harmonikatravel.service
curl -s http://127.0.0.1:3401/api/deals | head -c 200
```
