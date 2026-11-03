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
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const booking = await db.booking.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        reference: true,
        productName: true,
        variantName: true,
        quantity: true,
        unitPriceIdr: true,
        discountIdr: true,
        totalIdr: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        isDemo: true,
        cancellationReason: true,
        createdAt: true,
        schedule: { select: { startsAt: true, endsAt: true } },
      },
    });
    if (!booking) throw new HttpError(404, "Pesanan tidak ditemukan.");
    return NextResponse.json(
      { booking },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    await rateLimit("booking-cancellation", user.id, 20, 15 * 60 * 1000);
    const { id } = await context.params;
    const parsed = z
      .object({
        action: z.literal("request_cancellation"),
        reason: z.string().trim().min(5).max(1000),
      })
      .strict()
      .safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(
        400,
        "Isi alasan pembatalan sepanjang 5–1000 karakter.",
      );
    const updated = await db.booking.updateMany({
      where: {
        id,
        userId: user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        schedule: { startsAt: { gt: new Date() } },
      },
      data: {
        status: "CANCELLATION_REQUESTED",
        cancellationReason: parsed.data.reason,
      },
    });
    if (updated.count !== 1) {
      const existing = await db.booking.findFirst({
        where: { id, userId: user.id },
        select: { status: true },
      });
      if (!existing) throw new HttpError(404, "Pesanan tidak ditemukan.");
      if (existing.status !== "CANCELLATION_REQUESTED") {
        throw new HttpError(
          409,
          "Pesanan tidak dapat diajukan untuk pembatalan pada status atau jadwal ini.",
        );
      }
    }
    return NextResponse.json(
      {
        status: "CANCELLATION_REQUESTED",
        message:
          "Permintaan pembatalan tersimpan untuk ditinjau admin. Kapasitas dilepas setelah pembatalan disetujui.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
