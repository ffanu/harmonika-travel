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
import { catalog, destinations } from "./catalog-data.mjs";

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