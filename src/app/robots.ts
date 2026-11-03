import type { MetadataRoute } from "next";

const BASE = process.env.APP_ORIGIN?.replace(/\/$/, "") ?? "https://www.harmonikatravel.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/bookings", "/wishlist", "/login"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
