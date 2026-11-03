import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { partnershipStatusInput } from "@/lib/admin-schemas";
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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        status: z
          .enum(["NEW", "REVIEWING", "CONTACTED", "ACCEPTED", "REJECTED"])
          .optional(),
      })
      .strict()
      .safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) throw new HttpError(400, "Parameter tidak valid.");
    const { page, status } = parsed.data;
    const where = { status };
    const [items, total] = await db.$transaction([
      db.partnership.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * 20,
        take: 20,
      }),
      db.partnership.count({ where }),
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
    const parsed = partnershipStatusInput
      .extend({ id: z.string().min(1).max(100) })
      .safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(400, "ID atau status pengajuan tidak valid.");
    const { id, status } = parsed.data;
    const item = await db.$transaction(async (tx) => {
      const updated = await tx.partnership.update({
        where: { id },
        data: { status },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "UPDATE_STATUS",
          resource: "partnership",
          resourceId: id,
        },
      });
      return updated;
    });
    return NextResponse.json({ item }, { headers });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return apiError(new HttpError(404, "Pengajuan tidak ditemukan."));
    }
    return apiError(error);
  }
}
