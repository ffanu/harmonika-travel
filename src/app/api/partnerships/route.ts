import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  apiError,
  assertOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const input = z
  .object({
    businessName: z.string().trim().min(2).max(150),
    contactName: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{8,25}$/),
    category: z.nativeEnum(Category),
    message: z.string().trim().min(10).max(2000),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    const address = request.headers.get("x-real-ip") ?? "unknown";
    await rateLimit("partnership-address", address, 5, 60 * 60 * 1000);
    const parsed = input.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(
        400,
        "Periksa nama usaha, kontak, email, telepon, kategori, dan pesan.",
      );
    await rateLimit("partnership-email", parsed.data.email, 3, 60 * 60 * 1000);
    await db.partnership.create({ data: { ...parsed.data, status: "NEW" } });
    return NextResponse.json(
      { message: "Pengajuan kemitraan tersimpan untuk ditinjau admin." },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
