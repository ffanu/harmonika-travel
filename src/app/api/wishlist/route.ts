import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  apiError,
  assertOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const input = z.object({ productId: z.string().min(1).max(100) }).strict();
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
      })
      .strict()
      .safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success)
      throw new HttpError(400, "Parameter halaman tidak valid.");
    const { page } = parsed.data;
    const where = { userId: user.id, product: { active: true } };
    const [items, total] = await db.$transaction([
      db.wishlist.findMany({
        where,
        skip: (page - 1) * 20,
        take: 20,
        orderBy: [{ createdAt: "desc" }, { productId: "asc" }],
        select: {
          createdAt: true,
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              category: true,
              location: true,
              imageUrl: true,
              isDemo: true,
            },
          },
        },
      }),
      db.wishlist.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, limit: 20 }, { headers });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    await rateLimit("wishlist-user", user.id, 100, 15 * 60 * 1000);
    const parsed = input.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Produk tidak valid.");
    const { productId } = parsed.data;
    const product = await db.product.findFirst({
      where: { id: productId, active: true },
      select: { id: true },
    });
    if (!product) throw new HttpError(404, "Produk tidak ditemukan.");
    await db.wishlist.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    await rateLimit("wishlist-user", user.id, 100, 15 * 60 * 1000);
    const parsed = input.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Produk tidak valid.");
    await db.wishlist.deleteMany({
      where: { userId: user.id, productId: parsed.data.productId },
    });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return apiError(error);
  }
}
