import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { bookingInput, createBooking } from "@/lib/booking";
import {
  apiError,
  assertOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const pagination = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      })
      .safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!pagination.success)
      throw new HttpError(400, "Parameter halaman tidak valid.");
    const { page, limit } = pagination.data;
    const where = { userId: user.id };
    const [items, total] = await db.$transaction([
      db.booking.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          reference: true,
          productName: true,
          variantName: true,
          quantity: true,
          unitPriceIdr: true,
          discountIdr: true,
          totalIdr: true,
          status: true,
          isDemo: true,
          createdAt: true,
          cancellationReason: true,
          schedule: { select: { startsAt: true, endsAt: true } },
        },
      }),
      db.booking.count({ where }),
    ]);
    return NextResponse.json(
      { items, total, page, limit },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    await rateLimit("booking-user", user.id, 20, 15 * 60 * 1000);
    const parsed = bookingInput.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(
        400,
        "Data pemesanan tidak valid. Harga ditentukan oleh server.",
      );
    const booking = await createBooking(user.id, parsed.data);
    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          reference: booking.reference,
          productName: booking.productName,
          variantName: booking.variantName,
          quantity: booking.quantity,
          unitPriceIdr: booking.unitPriceIdr,
          discountIdr: booking.discountIdr,
          totalIdr: booking.totalIdr,
          status: booking.status,
          isDemo: booking.isDemo,
        },
        message:
          "Pemesanan demo tersimpan. Tidak ada pembayaran atau penerbitan tiket.",
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
