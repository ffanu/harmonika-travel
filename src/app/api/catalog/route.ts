import { NextRequest, NextResponse } from "next/server";
import { Category, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, HttpError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const filters = z
  .object({
    q: z.string().trim().max(100).optional(),
    category: z.nativeEnum(Category).optional(),
    destination: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    quantity: z.coerce.number().int().min(1).max(20).default(1),
    minimumPrice: z.coerce.number().int().min(0).max(2147483647).optional(),
    maximumPrice: z.coerce.number().int().min(0).max(2147483647).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const parsed = filters.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!parsed.success)
      throw new HttpError(400, "Filter katalog tidak valid.");
    const input = parsed.data;
    if (
      input.minimumPrice !== undefined &&
      input.maximumPrice !== undefined &&
      input.minimumPrice > input.maximumPrice
    ) {
      throw new HttpError(400, "Rentang harga tidak valid.");
    }
    const now = new Date();
    let startsAt: Prisma.DateTimeFilter = { gt: now };
    if (input.date) {
      const start = new Date(`${input.date}T00:00:00+07:00`);
      if (
        !Number.isFinite(start.getTime()) ||
        new Date(start.getTime() + 7 * 3600000).toISOString().slice(0, 10) !==
          input.date
      ) {
        throw new HttpError(400, "Tanggal tidak valid.");
      }
      startsAt = {
        gte: start,
        lt: new Date(start.getTime() + 86400000),
        gt: now,
      };
    }
    const availableSchedules = await db.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Schedule"
      WHERE "active" = true
        AND "startsAt" > ${now}
        AND "capacity" - "reserved" >= ${input.quantity}
        AND "priceIdr" >= ${input.minimumPrice ?? 0}
        AND "priceIdr" <= ${input.maximumPrice ?? 2147483647}
        ${input.date ? Prisma.sql`AND "startsAt" >= ${new Date(`${input.date}T00:00:00+07:00`)} AND "startsAt" < ${new Date(new Date(`${input.date}T00:00:00+07:00`).getTime() + 86400000)}` : Prisma.empty}
    `;
    const scheduleWhere: Prisma.ScheduleWhereInput = {
      id: { in: availableSchedules.map((schedule) => schedule.id) },
      active: true,
      startsAt,
      priceIdr: { gte: input.minimumPrice, lte: input.maximumPrice },
    };
    const where: Prisma.ProductWhereInput = {
      active: true,
      category: input.category,
      ...(input.destination
        ? { destination: { slug: input.destination } }
        : {}),
      ...(input.q
        ? {
            OR: [
              { name: { contains: input.q, mode: "insensitive" } },
              { location: { contains: input.q, mode: "insensitive" } },
              {
                destination: {
                  name: { contains: input.q, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
      variants: { some: { active: true, schedules: { some: scheduleWhere } } },
    };
    const [products, total] = await db.$transaction([
      db.product.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          description: true,
          imageUrl: true,
          location: true,
          isDemo: true,
          destination: { select: { slug: true, name: true, country: true } },
          variants: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              schedules: {
                where: scheduleWhere,
                orderBy: [{ priceIdr: "asc" }, { startsAt: "asc" }],
                select: {
                  id: true,
                  startsAt: true,
                  endsAt: true,
                  capacity: true,
                  reserved: true,
                  priceIdr: true,
                },
              },
            },
          },
        },
      }),
      db.product.count({ where }),
    ]);
    const items = products.map((product) => ({
      ...product,
      variants: product.variants
        .map((variant) => ({
          ...variant,
          schedules: variant.schedules
            .filter(
              (schedule) =>
                schedule.capacity - schedule.reserved >= input.quantity,
            )
            .map(({ capacity, reserved, ...schedule }) => ({
              ...schedule,
              available: capacity - reserved,
            })),
        }))
        .filter((variant) => variant.schedules.length > 0),
    }));
    return NextResponse.json(
      { items, total, page: input.page, limit: input.limit },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
