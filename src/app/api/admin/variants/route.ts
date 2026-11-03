import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { variantInput } from "@/lib/admin-schemas";
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
    if (error.code === "P2003")
      return apiError(
        new HttpError(
          409,
          "Produk tidak valid atau varian masih memiliki jadwal.",
        ),
      );
    if (error.code === "P2025")
      return apiError(new HttpError(404, "Varian tidak ditemukan."));
    if (error.code === "P2034")
      return apiError(
        new HttpError(
          409,
          "Data berubah bersamaan. Muat ulang sebelum mencoba lagi.",
        ),
      );
  }
  return apiError(error);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        productId: identifier.optional(),
      })
      .strict()
      .safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) throw new HttpError(400, "Parameter tidak valid.");
    const { page, productId } = parsed.data;
    const where = { productId };
    const [items, total] = await db.$transaction([
      db.variant.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (page - 1) * 20,
        take: 20,
        include: { product: { select: { name: true } } },
      }),
      db.variant.count({ where }),
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
    const parsed = variantInput.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Data varian tidak valid.");
    const item = await db.$transaction(async (tx) => {
      const created = await tx.variant.create({ data: parsed.data });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "CREATE",
          resource: "variant",
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
    const parsed = variantInput
      .extend({ id: identifier })
      .safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Data varian tidak valid.");
    const { id, ...data } = parsed.data;
    const item = await db.$transaction(
      async (tx) => {
        const existing = await tx.variant.findUnique({
          where: { id },
          select: { productId: true },
        });
        if (!existing) throw new HttpError(404, "Varian tidak ditemukan.");
        if (existing.productId !== data.productId)
          throw new HttpError(
            409,
            "Produk induk varian tidak dapat diganti. Buat varian baru.",
          );
        const updated = await tx.variant.update({ where: { id }, data });
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: "UPDATE",
            resource: "variant",
            resourceId: id,
          },
        });
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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
    if (!parsed.success) throw new HttpError(400, "ID varian tidak valid.");
    await db.$transaction(async (tx) => {
      await tx.variant.delete({ where: { id: parsed.data.id } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "DELETE",
          resource: "variant",
          resourceId: parsed.data.id,
        },
      });
    });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return failure(error);
  }
}
