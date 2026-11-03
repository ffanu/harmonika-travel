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
| Deploy | **live** di `https://www.harmonikatravel.com` (systemd `harmonikatravel.service`, loopback 3401, reverse proxy nginx) |
| Data katalog | **demo** (`isDemo = true`), bukan inventori nyata |
| Pembayaran | **tidak ada** payment gateway; booking tetap `PENDING`, tidak pernah ditandai lunas |
| Tiket nyata | tidak diterbitkan |
| Integrasi supplier | tidak tersedia (tidak ada kredensial) |
| Kesetaraan fitur Traveloka | **tidak diklaim**; lihat `WORKFLOW.md` bagian keterbatasan |

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
nginx:   sites-available/www.harmonikatravel.com.conf -> proxy_pass 127.0.0.1:3401
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
