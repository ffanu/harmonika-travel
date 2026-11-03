import type { MetadataRoute } from "next";
import { popularRoutes, routeSlug } from "@/lib/travelpayouts";

/**
 * Sitemap dinamis: halaman statis + halaman rute dari rute populer mitra.
 *
 * Sengaja `force-dynamic`: bila dirender saat build, token mitra belum ada dan
 * daftar rute akan kosong lalu ter-cache. Rute diambil per permintaan
 * (di-cache di CDN) dan kegagalan mitra tidak menggagalkan sitemap.
 */
export const dynamic = "force-dynamic";

const BASE = process.env.APP_ORIGIN?.replace(/\/$/, "") ?? "https://www.harmonikatravel.com";

const ORIGINS = ["CGK", "SUB", "KNO", "UPG", "DPS"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/flights`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/hotels`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/trips`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/promos`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const lists = await Promise.allSettled(ORIGINS.map((origin) => popularRoutes(origin, 20)));
  const seen = new Set<string>();
  const routes: MetadataRoute.Sitemap = [];

  // Rute dikumpulkan per origin agar URL-nya benar (bukan selalu CGK).
  for (let index = 0; index < ORIGINS.length; index += 1) {
    const result = lists[index];
    if (result.status !== "fulfilled") continue;
    for (const route of result.value) {
      const slug = routeSlug(ORIGINS[index], route.code);
      if (seen.has(slug)) continue;
      seen.add(slug);
      routes.push({
        url: `${BASE}/flights/${slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  return [...statics, ...routes];
}
