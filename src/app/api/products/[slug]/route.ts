import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError, HttpError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 150) {
      throw new HttpError(404, "Produk tidak ditemukan.");
    }
    const product = await db.product.findFirst({
      where: { slug, active: true },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
        location: true,
        imageUrl: true,
        isDemo: true,
        destination: { select: { name: true, country: true } },
        variants: {
          where: { active: true },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          take: 50,
          select: {
            id: true,
            name: true,
            description: true,
            schedules: {
              where: {
                active: true,
                startsAt: { gt: new Date() },
                reserved: { lt: db.schedule.fields.capacity },
              },
              orderBy: [{ startsAt: "asc" }, { id: "asc" }],
              take: 60,
              select: {
                id: true,
                startsAt: true,
                endsAt: true,
                priceIdr: true,
                capacity: true,
                reserved: true,
              },
            },
          },
        },
      },
    });
    if (!product) throw new HttpError(404, "Produk tidak ditemukan.");
    const item = {
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        schedules: variant.schedules.map(
          ({ capacity, reserved, ...schedule }) => ({
            ...schedule,
            available: capacity - reserved,
          }),
        ),
      })),
    };
    return NextResponse.json(
      { item, scheduleLimitPerVariant: 60 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
