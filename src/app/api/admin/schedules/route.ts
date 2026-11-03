import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { scheduleInput } from "@/lib/admin-schemas";
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
const updateInput = z.object({ id: identifier, data: scheduleInput }).strict();

function failure(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return apiError(
        new HttpError(409, "Jadwal varian pada waktu tersebut sudah ada."),
      );
    if (error.code === "P2003")
      return apiError(
        new HttpError(
          409,
          "Varian tidak valid atau jadwal masih memiliki pesanan.",
        ),
      );
    if (error.code === "P2025")
      return apiError(new HttpError(404, "Jadwal tidak ditemukan."));
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
        variantId: identifier.optional(),
      })
      .strict()
      .safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) throw new HttpError(400, "Parameter tidak valid.");
    const { page, variantId } = parsed.data;
    const where = { variantId };
    const [items, total] = await db.$transaction([
      db.schedule.findMany({
        where,
        orderBy: [{ startsAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * 20,
        take: 20,
        include: {
          variant: {
            select: { name: true, product: { select: { name: true } } },
          },
        },
      }),
      db.schedule.count({ where }),
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
    await rateLimit("admin-write", actor.id, 100, 900000);
    const parsed = scheduleInput.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Data jadwal tidak valid.");
    if (parsed.data.startsAt <= new Date())
      throw new HttpError(400, "Jadwal baru harus berada di masa depan.");
    const item = await db.$transaction(async (tx) => {
      const created = await tx.schedule.create({
        data: { ...parsed.data, reserved: 0 },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "CREATE",
          resource: "schedule",
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
    await rateLimit("admin-write", actor.id, 100, 900000);
    const parsed = updateInput.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(400, "Gunakan objek id dan data jadwal yang valid.");
    const { id, data } = parsed.data;
    const item = await db.$transaction(
      async (tx) => {
        const existing = await tx.schedule.findUnique({
          where: { id },
          include: { _count: { select: { bookings: true } } },
        });
        if (!existing) throw new HttpError(404, "Jadwal tidak ditemukan.");
        if (existing.variantId !== data.variantId)
          throw new HttpError(409, "Varian jadwal tidak dapat diganti.");
        if (data.capacity < existing.reserved)
          throw new HttpError(
            409,
            "Kapasitas tidak boleh lebih kecil dari jumlah yang sudah dipesan.",
          );
        const changedTime =
          existing.startsAt.getTime() !== data.startsAt.getTime() ||
          existing.endsAt.getTime() !== data.endsAt.getTime();
        if (changedTime && existing._count.bookings > 0)
          throw new HttpError(
            409,
            "Waktu jadwal yang memiliki riwayat pesanan tidak dapat diubah.",
          );
        if (changedTime && data.startsAt <= new Date())
          throw new HttpError(
            400,
            "Waktu mulai baru harus berada di masa depan.",
          );
        const updated = await tx.schedule.update({ where: { id }, data });
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: "UPDATE",
            resource: "schedule",
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
    await rateLimit("admin-write", actor.id, 100, 900000);
    const parsed = z
      .object({ id: identifier })
      .strict()
      .safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "ID jadwal tidak valid.");
    await db.$transaction(
      async (tx) => {
        const existing = await tx.schedule.findUnique({
          where: { id: parsed.data.id },
          select: { reserved: true, _count: { select: { bookings: true } } },
        });
        if (!existing) throw new HttpError(404, "Jadwal tidak ditemukan.");
        if (existing.reserved > 0 || existing._count.bookings > 0)
          throw new HttpError(
            409,
            "Jadwal memiliki riwayat pesanan. Nonaktifkan jadwal melalui pembaruan.",
          );
        await tx.schedule.delete({ where: { id: parsed.data.id } });
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: "DELETE",
            resource: "schedule",
            resourceId: parsed.data.id,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return failure(error);
  }
}
