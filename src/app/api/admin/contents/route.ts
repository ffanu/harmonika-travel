import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { contentInput } from "@/lib/admin-schemas";
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
      return apiError(new HttpError(409, "Slug konten sudah digunakan."));
    if (error.code === "P2025")
      return apiError(new HttpError(404, "Konten tidak ditemukan."));
  }
  return apiError(error);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = z
      .object({ page: z.coerce.number().int().min(1).max(10000).default(1) })
      .strict()
      .safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success)
      throw new HttpError(400, "Parameter halaman tidak valid.");
    const { page } = parsed.data;
    const [items, total] = await db.$transaction([
      db.content.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * 20,
        take: 20,
      }),
      db.content.count(),
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
    const parsed = contentInput.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Data konten tidak valid.");
    const item = await db.$transaction(async (tx) => {
      const created = await tx.content.create({ data: parsed.data });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "CREATE",
          resource: "content",
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
    const parsed = contentInput
      .extend({ id: identifier })
      .safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "Data konten tidak valid.");
    const { id, ...data } = parsed.data;
    const item = await db.$transaction(async (tx) => {
      const updated = await tx.content.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "UPDATE",
          resource: "content",
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
    await rateLimit("admin-write", actor.id, 100, 900000);
    const parsed = z
      .object({ id: identifier })
      .strict()
      .safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "ID konten tidak valid.");
    await db.$transaction(async (tx) => {
      await tx.content.delete({ where: { id: parsed.data.id } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "DELETE",
          resource: "content",
          resourceId: parsed.data.id,
        },
      });
    });
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return failure(error);
  }
}
