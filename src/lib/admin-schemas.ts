import { Category } from "@prisma/client";
import { z } from "zod";

const id = z.string().min(1).max(100);
const slug = z
  .string()
  .min(2)
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const money = z.number().int().min(0).max(100000000);
const date = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));
const image = z
  .string()
  .url()
  .max(2000)
  .refine((value) => value.startsWith("https://"), "Gunakan URL HTTPS.")
  .nullable()
  .optional();

export const destinationInput = z
  .object({
    slug,
    name: z.string().trim().min(2).max(150),
    country: z.string().trim().min(2).max(100),
    description: z.string().trim().max(5000).default(""),
    imageUrl: image,
  })
  .strict();

export const productInput = z
  .object({
    slug,
    name: z.string().trim().min(2).max(200),
    category: z.nativeEnum(Category),
    description: z.string().trim().min(10).max(10000),
    location: z.string().trim().min(2).max(200),
    destinationId: id,
    imageUrl: image,
    active: z.boolean().default(false),
    isDemo: z.literal(true).default(true),
  })
  .strict();

export const variantInput = z
  .object({
    productId: id,
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(5000).default(""),
    priceIdr: money,
    active: z.boolean().default(true),
  })
  .strict();

export const scheduleInput = z
  .object({
    variantId: id,
    startsAt: date,
    endsAt: date,
    capacity: z.number().int().min(0).max(100000),
    priceIdr: money,
    active: z.boolean().default(true),
  })
  .strict()
  .refine((value) => value.endsAt > value.startsAt, {
    message: "Waktu selesai harus setelah waktu mulai.",
    path: ["endsAt"],
  });

export const promoInput = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/)
      .transform((value) => value.toUpperCase()),
    title: z.string().trim().min(2).max(150),
    description: z.string().trim().max(5000).default(""),
    discountIdr: money,
    minimumTotalIdr: money.default(0),
    startsAt: date,
    endsAt: date,
    active: z.boolean().default(false),
  })
  .strict()
  .refine((value) => value.endsAt > value.startsAt, {
    message: "Masa berlaku promo tidak valid.",
    path: ["endsAt"],
  });

export const contentInput = z
  .object({
    slug,
    title: z.string().trim().min(2).max(200),
    body: z.string().trim().min(1).max(20000),
    published: z.boolean().default(false),
  })
  .strict();

export const partnershipStatusInput = z
  .object({
    status: z.enum(["NEW", "REVIEWING", "CONTACTED", "ACCEPTED", "REJECTED"]),
  })
  .strict();
