import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
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
const transitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED", "COMPLETED"],
  CANCELLATION_REQUESTED: ["CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        status: z.nativeEnum(BookingStatus).optional(),
      })
      .strict()
      .safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) throw new HttpError(400, "Parameter tidak valid.");
    const { page, status } = parsed.data;
    const where = { status };
    const [items, total] = await db.$transaction([
      db.booking.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * 20,
        take: 20,
        select: {
          id: true,
          reference: true,
          productName: true,
          variantName: true,
          quantity: true,
          totalIdr: true,
          status: true,
          isDemo: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          cancellationReason: true,
          createdAt: true,
          schedule: { select: { startsAt: true, endsAt: true } },
        },
      }),
      db.booking.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, limit: 20 }, { headers });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertOrigin(request);
    const actor = await requireAdmin();
    await rateLimit("admin-write", actor.id, 100, 900000);
    const parsed = z
      .object({
        id: z.string().min(1).max(100),
        expectedStatus: z.nativeEnum(BookingStatus),
        status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
      })
      .strict()
      .safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(400, "Data perubahan status tidak valid.");
    const { id, expectedStatus, status } = parsed.data;
    const item = await db.$transaction(
      async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id },
          include: { schedule: { select: { endsAt: true } } },
        });
        if (!booking) throw new HttpError(404, "Pesanan tidak ditemukan.");
        if (booking.status !== expectedStatus)
          throw new HttpError(409, "Status telah berubah. Muat ulang pesanan.");
        if (!transitions[booking.status].includes(status))
          throw new HttpError(409, "Perubahan status tidak diizinkan.");
        if (!booking.isDemo)
          throw new HttpError(
            409,
            "Pesanan operasional memerlukan integrasi penyedia.",
          );
        if (status === "COMPLETED" && booking.schedule.endsAt > new Date()) {
          throw new HttpError(409, "Jadwal belum selesai.");
        }
        const changed = await tx.booking.updateMany({
          where: { id, status: expectedStatus },
          data: { status },
        });
        if (changed.count !== 1)
          throw new HttpError(409, "Status telah berubah. Muat ulang pesanan.");
        if (status === "CANCELLED") {
          const released = await tx.schedule.updateMany({
            where: {
              id: booking.scheduleId,
              reserved: { gte: booking.quantity },
            },
            data: { reserved: { decrement: booking.quantity } },
          });
          if (released.count !== 1)
            throw new HttpError(
              409,
              "Kapasitas tidak konsisten. Perubahan dibatalkan.",
            );
        }
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: `STATUS_${expectedStatus}_TO_${status}`,
            resource: "booking",
            resourceId: id,
          },
        });
        return {
          id,
          reference: booking.reference,
          status,
          isDemo: booking.isDemo,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ item }, { headers });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return apiError(
        new HttpError(
          409,
          "Data berubah bersamaan. Muat ulang sebelum mencoba lagi.",
        ),
      );
    }
    return apiError(error);
  }
}
