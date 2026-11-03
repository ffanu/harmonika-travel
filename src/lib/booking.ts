import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { HttpError } from "./http";

export const bookingInput = z
  .object({
    scheduleId: z.string().min(1).max(100),
    idempotencyKey: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
    contactName: z.string().trim().min(2).max(100),
    contactEmail: z.string().trim().email().max(254),
    contactPhone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{8,25}$/),
    promoCode: z.string().trim().max(40).optional(),
  })
  .strict();

export async function createBooking(
  userId: string,
  input: z.infer<typeof bookingInput>,
) {
  const data = bookingInput.parse(input);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const existing = await tx.booking.findUnique({
            where: {
              userId_idempotencyKey: {
                userId,
                idempotencyKey: data.idempotencyKey,
              },
            },
          });
          if (existing) {
            if (
              existing.scheduleId !== data.scheduleId ||
              existing.quantity !== data.quantity ||
              existing.contactName !== data.contactName ||
              existing.contactEmail !== data.contactEmail ||
              existing.contactPhone !== data.contactPhone
            ) {
              throw new HttpError(
                409,
                "Kunci pemesanan sudah digunakan untuk data berbeda.",
              );
            }
            return existing;
          }
          const schedule = await tx.schedule.findUnique({
            where: { id: data.scheduleId },
            include: { variant: { include: { product: true } } },
          });
          const now = new Date();
          if (
            !schedule ||
            !schedule.active ||
            !schedule.variant.active ||
            !schedule.variant.product.active ||
            schedule.startsAt <= now
          ) {
            throw new HttpError(409, "Jadwal tidak tersedia.");
          }
          // Supplier integrations are required before accepting operational bookings.
          if (!schedule.variant.product.isDemo) {
            throw new HttpError(409, "Pemesanan operasional belum tersedia.");
          }
          if (
            schedule.priceIdr < 0 ||
            schedule.capacity < 0 ||
            schedule.reserved < 0
          ) {
            throw new HttpError(409, "Konfigurasi jadwal tidak valid.");
          }
          const subtotal = schedule.priceIdr * data.quantity;
          if (!Number.isSafeInteger(subtotal) || subtotal > 2147483647) {
            throw new HttpError(400, "Total pemesanan melewati batas.");
          }
          let discountIdr = 0;
          let promoId: string | undefined;
          if (data.promoCode) {
            const promo = await tx.promo.findUnique({
              where: { code: data.promoCode.toUpperCase() },
            });
            if (
              !promo ||
              !promo.active ||
              promo.startsAt > now ||
              promo.endsAt <= now ||
              subtotal < promo.minimumTotalIdr ||
              promo.discountIdr < 0
            ) {
              throw new HttpError(
                400,
                "Promo tidak berlaku untuk pemesanan ini.",
              );
            }
            discountIdr = Math.min(subtotal, promo.discountIdr);
            promoId = promo.id;
          }
          const updated = await tx.schedule.updateMany({
            where: {
              id: schedule.id,
              active: true,
              reserved: { lte: schedule.capacity - data.quantity },
            },
            data: { reserved: { increment: data.quantity } },
          });
          if (updated.count !== 1)
            throw new HttpError(409, "Kapasitas jadwal tidak mencukupi.");
          return tx.booking.create({
            data: {
              userId,
              scheduleId: schedule.id,
              idempotencyKey: data.idempotencyKey,
              reference: `HT-${randomBytes(12).toString("hex").toUpperCase()}`,
              quantity: data.quantity,
              unitPriceIdr: schedule.priceIdr,
              discountIdr,
              totalIdr: subtotal - discountIdr,
              promoId,
              productName: schedule.variant.product.name,
              variantName: schedule.variant.name,
              contactName: data.contactName,
              contactEmail: data.contactEmail,
              contactPhone: data.contactPhone,
              isDemo: true,
              status: "PENDING",
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code)
      ) {
        if (attempt < 2) continue;
        throw new HttpError(
          409,
          "Terjadi konflik pemesanan. Periksa daftar pesanan sebelum mencoba lagi.",
        );
      }
      throw error;
    }
  }
  throw new HttpError(409, "Pemesanan belum dapat diselesaikan.");
}
