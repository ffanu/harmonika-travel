import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productInput } from "@/lib/admin-schemas";
import {
  apiError,
  assertOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const identifier = z.string().min(1).max(100);
function failure(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return apiError(new HttpError(409, "Slug produk sudah digunakan."));
    if (error.code === "P2003")
      return apiError(
        new HttpError(
          409,
          "Relasi produk tidak valid atau produk masih memiliki varian. Nonaktifkan produk untuk menghentikan penjualan.",
        ),
      );
    if (error.code === "P2025")
      return apiError(new HttpError(404, "Produk tidak ditemukan."));
  }
  return apiError(error);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        q: z.string().trim().max(100).optional(),
      })
      .strict()
      .safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) throw new HttpError(400, "Parameter tidak valid.");
    const { page, q } = parsed.data;
    const where: Prisma.ProductWhereInput = q
      ? { name: { contains: q, mode: "insensitive" } }
      : {};
    const [items, total] = await db.$transaction([
      db.product.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (page - 1) * 20,
        take: 20,
        include: {
          destination: { select: { name: true } },
          _count: { select: { variants: true } },
        },
      }),
      db.product.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, limit: 20 }, { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    const actor = await requireAdmin();
    await rateLimit("admin-write", actor.id, 100, 15 * 60 * 1000);
    const parsed = productInput.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Data produk tidak valid.");
    const item = await db.$transaction(async (tx) => {
      const created = await tx.product.create({ data: parsed.data });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "CREATE",
          resource: "product",
          resourceId: created.id,
        },
      });
      return created;
    });
    return NextResponse.json({ item }, { status: 201, headers });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    assertOrigin(request);
    const actor = await requireAdmin();
    await rateLimit("admin-write", actor.id, 100, 15 * 60 * 1000);
    const parsed = productInput
      .extend({ id: identifier })
      .safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Data produk tidak valid.");
    const { id, ...data } = parsed.data;
    const item = await db.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "UPDATE",
          resource: "product",
          resourceId: id,
        },
      });
      return updated;
    });
    return NextResponse.json({ item }, { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertOrigin(request);
    const actor = await requireAdmin();
    await rateLimit("admin-write", actor.id, 100, 15 * 60 * 1000);
    const parsed = z
      .object({ id: identifier })
      .strict()
      .safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "ID produk tidak valid.");
    await db.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: parsed.data.id } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "DELETE",
          resource: "product",
          resourceId: parsed.data.id,
        },
      });
    });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return failure(error);
  }
}
