#!/usr/bin/env node
/**
 * Seed admin + demo catalog.
 *
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... node scripts/seed.mjs
 *
 * The admin password comes from the environment only: there is no default
 * credential and nothing secret is printed. Re-running is safe (upserts).
 */
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCallback);
const db = new PrismaClient();

const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || "";

if (!email || !email.includes("@")) {
  console.error("SEED_ADMIN_EMAIL wajib diisi dengan email valid.");
  process.exit(2);
}
if (password.length < 12) {
  console.error("SEED_ADMIN_PASSWORD wajib minimal 12 karakter.");
  process.exit(2);
}

async function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(value, salt, 64);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

const DAY = 24 * 60 * 60 * 1000;
const upcoming = (days, hour = 8) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

const destinations = [
  { slug: "bali", name: "Bali", country: "Indonesia", description: "Pulau dewata dengan pantai, sawah terasering, dan budaya yang kaya." },
  { slug: "jakarta", name: "Jakarta", country: "Indonesia", description: "Ibu kota dengan pusat bisnis, kuliner, dan wisata kota." },
  { slug: "yogyakarta", name: "Yogyakarta", country: "Indonesia", description: "Kota budaya dengan candi, keraton, dan seni tradisional." },
  { slug: "labuan-bajo", name: "Labuan Bajo", country: "Indonesia", description: "Gerbang menuju Komodo dengan panorama laut dan perbukitan." },
  { slug: "singapore", name: "Singapura", country: "Singapura", description: "Kota-negara modern dengan taman tematik dan pusat belanja." },
  { slug: "tokyo", name: "Tokyo", country: "Jepang", description: "Metropolis dengan transportasi rapi, kuliner, dan budaya pop." },
];

const catalog = [
  { slug: "hotel-bali-pantai-nusa-dua", name: "Harmonika Resort Nusa Dua", category: "HOTEL", destination: "bali", location: "Nusa Dua, Bali", description: "Resor tepi pantai dengan kolam renang dan sarapan untuk dua orang.", variants: [{ name: "Deluxe Garden View", price: 1250000 }, { name: "Premier Ocean View", price: 1850000 }] },
  { slug: "hotel-jakarta-pusat", name: "Harmonika City Hotel Jakarta", category: "HOTEL", destination: "jakarta", location: "Sudirman, Jakarta", description: "Hotel bisnis dekat stasiun MRT dengan ruang kerja dan gym.", variants: [{ name: "Superior Room", price: 780000 }, { name: "Executive Room", price: 1150000 }] },
  { slug: "flight-cgk-dps", name: "Penerbangan Jakarta - Denpasar", category: "FLIGHT", destination: "bali", location: "CGK ke DPS", description: "Penerbangan langsung kelas ekonomi dengan bagasi kabin 7 kg.", variants: [{ name: "Ekonomi Reguler", price: 890000 }, { name: "Ekonomi Fleksibel", price: 1340000 }] },
  { slug: "flight-cgk-sin", name: "Penerbangan Jakarta - Singapura", category: "FLIGHT", destination: "singapore", location: "CGK ke SIN", description: "Penerbangan internasional langsung, bagasi 20 kg termasuk.", variants: [{ name: "Ekonomi Reguler", price: 1450000 }, { name: "Ekonomi Plus", price: 2100000 }] },
  { slug: "transfer-cgk-hotel", name: "Airport Transfer Soekarno-Hatta", category: "AIRPORT_TRANSFER", destination: "jakarta", location: "CGK ke Jakarta Pusat", description: "Antar jemput bandara dengan mobil berpendingin dan pengemudi.", variants: [{ name: "Sedan (1-3 orang)", price: 250000 }, { name: "MPV (1-5 orang)", price: 400000 }] },
  { slug: "car-rental-bali", name: "Sewa Mobil Bali Lepas Kunci", category: "CAR_RENTAL", destination: "bali", location: "Denpasar, Bali", description: "Sewa mobil harian lepas kunci, termasuk asuransi dasar.", variants: [{ name: "City Car 1 hari", price: 320000 }, { name: "SUV 1 hari", price: 560000 }] },
  { slug: "activity-ubud-sawah", name: "Tur Sawah Terasering Ubud", category: "ACTIVITY", destination: "bali", location: "Ubud, Bali", description: "Tur setengah hari ke Tegallalang dengan pemandu lokal.", variants: [{ name: "Tur Reguler", price: 375000 }, { name: "Tur Privat", price: 690000 }] },
  { slug: "activity-komodo-sailing", name: "Sailing Komodo 1 Hari", category: "ACTIVITY", destination: "labuan-bajo", location: "Labuan Bajo, NTT", description: "Pelayaran sehari ke Padar dan Pink Beach dengan makan siang.", variants: [{ name: "Open Trip", price: 1150000 }, { name: "Private Charter", price: 4200000 }] },
  { slug: "cruise-singapore-strait", name: "Cruise Selat Singapura 3 Hari", category: "CRUISE", destination: "singapore", location: "Singapura", description: "Pelayaran tiga hari dua malam dengan kabin interior dan makan penuh.", variants: [{ name: "Interior Cabin", price: 3850000 }, { name: "Balcony Cabin", price: 5600000 }] },
  { slug: "cruise-tokyo-bay", name: "Cruise Teluk Tokyo 5 Hari", category: "CRUISE", destination: "tokyo", location: "Tokyo, Jepang", description: "Lima hari empat malam menyusuri teluk dengan tur kota singkat.", variants: [{ name: "Ocean View", price: 7200000 }] },
];
async function main() {
  const passwordHash = await hashPassword(password);

  const admin = await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: { email, name: "Administrator Harmonika Travel", passwordHash, role: "ADMIN" },
  });

  const destinationIds = new Map();
  for (const item of destinations) {
    const row = await db.destination.upsert({
      where: { slug: item.slug },
      update: { name: item.name, country: item.country, description: item.description },
      create: item,
    });
    destinationIds.set(item.slug, row.id);
  }

  let products = 0;
  let schedules = 0;
  for (const item of catalog) {
    const data = {
      name: item.name,
      category: item.category,
      location: item.location,
      description: item.description,
      destinationId: destinationIds.get(item.destination),
      active: true,
      isDemo: true,
    };
    const product = await db.product.upsert({
      where: { slug: item.slug },
      update: data,
      create: { slug: item.slug, ...data },
    });
    products += 1;

    for (const variant of item.variants) {
      const existing = await db.variant.findFirst({ where: { productId: product.id, name: variant.name } });
      const saved = existing
        ? await db.variant.update({ where: { id: existing.id }, data: { priceIdr: variant.price, active: true } })
        : await db.variant.create({
            data: { productId: product.id, name: variant.name, description: item.description, priceIdr: variant.price, active: true },
          });

      for (const offset of [14, 28]) {
        const startsAt = upcoming(offset);
        await db.schedule.upsert({
          where: { variantId_startsAt: { variantId: saved.id, startsAt } },
          update: { capacity: 20, priceIdr: variant.price, active: true },
          create: { variantId: saved.id, startsAt, endsAt: new Date(startsAt.getTime() + DAY), capacity: 20, priceIdr: variant.price, active: true },
        });
        schedules += 1;
      }
    }
  }

  const now = Date.now();
  await db.promo.upsert({
    where: { code: "DEMO10" },
    update: { active: true },
    create: {
      code: "DEMO10",
      title: "Diskon demo Rp100.000",
      description: "Kode demo untuk pengujian; tidak terkait pembayaran nyata.",
      discountIdr: 100000,
      minimumTotalIdr: 500000,
      startsAt: new Date(now - DAY),
      endsAt: new Date(now + 90 * DAY),
      active: true,
    },
  });

  await db.content.upsert({
    where: { slug: "panduan-liburan-bali" },
    update: {},
    create: {
      slug: "panduan-liburan-bali",
      title: "Panduan singkat liburan ke Bali",
      body: "Artikel contoh untuk menguji halaman blog. Isi bersifat demo dan bukan konten operasional.",
      published: true,
    },
  });

  console.log(JSON.stringify({ ok: true, admin: admin.email, destinations: destinations.length, products, schedules }));
}

main()
  .catch((error) => {
    console.error("seed_failed", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());