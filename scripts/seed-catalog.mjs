#!/usr/bin/env node
/**
 * Seed katalog demo saja (destinasi, produk, varian, jadwal) tanpa menyentuh
 * akun pengguna maupun admin.
 *
 *   DATABASE_URL=... node scripts/seed-catalog.mjs
 *
 * Aman dijalankan berulang: semua penulisan memakai upsert.
 */
import { PrismaClient } from "@prisma/client";
import { catalog, destinations } from "./catalog-data.mjs";

const db = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const upcoming = (days, hour = 8) => {
  const date = new Date(Date.now() + days * DAY);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};

async function main() {
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
      const existing = await db.variant.findFirst({
        where: { productId: product.id, name: variant.name },
      });
      const saved = existing
        ? await db.variant.update({
            where: { id: existing.id },
            data: { priceIdr: variant.price, active: true },
          })
        : await db.variant.create({
            data: {
              productId: product.id,
              name: variant.name,
              description: item.description,
              priceIdr: variant.price,
              active: true,
            },
          });

      for (const offset of [14, 28]) {
        const startsAt = upcoming(offset);
        await db.schedule.upsert({
          where: { variantId_startsAt: { variantId: saved.id, startsAt } },
          update: { capacity: 20, priceIdr: variant.price, active: true },
          create: {
            variantId: saved.id,
            startsAt,
            endsAt: new Date(startsAt.getTime() + DAY),
            capacity: 20,
            priceIdr: variant.price,
            active: true,
          },
        });
        schedules += 1;
      }
    }
  }

  console.log(
    JSON.stringify({ ok: true, destinations: destinations.length, products, schedules }),
  );
}

main()
  .catch((error) => {
    console.error(
      "seed_catalog_failed",
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
