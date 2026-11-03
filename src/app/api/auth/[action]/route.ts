import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  currentUser,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  apiError,
  assertOrigin,
  HttpError,
  rateLimit,
  readJson,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const credentials = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(12)
      .max(256)
      .refine((value) => Buffer.byteLength(value, "utf8") <= 256),
  })
  .strict();
const registration = credentials.extend({
  name: z.string().trim().min(2).max(100),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  try {
    const { action } = await context.params;
    if (action !== "session")
      throw new HttpError(404, "Endpoint tidak ditemukan.");
    const response = NextResponse.json({ user: await currentUser() });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  try {
    assertOrigin(request);
    const { action } = await context.params;
    if (!["register", "login", "logout"].includes(action))
      throw new HttpError(404, "Endpoint tidak ditemukan.");
    if (action === "logout") {
      await destroySession();
      return NextResponse.json({ ok: true });
    }
    // Nginx must replace X-Real-IP and the app must bind only to loopback.
    const address = request.headers.get("x-real-ip") ?? "unknown";
    await rateLimit("auth-address", address, 30, 15 * 60 * 1000);
    const body = await readJson(request);
    const parsed = (
      action === "register" ? registration : credentials
    ).safeParse(body);
    if (!parsed.success)
      throw new HttpError(
        400,
        "Periksa email, nama, dan password minimal 12 karakter (maksimal 256 byte).",
      );
    const { email, password } = parsed.data;
    await rateLimit("auth-account", email, 10, 15 * 60 * 1000);
    if (action === "register") {
      const data = registration.parse(parsed.data);
      const passwordHash = await hashPassword(data.password);
      try {
        await db.user.create({
          data: {
            email: data.email,
            name: data.name,
            passwordHash,
            role: "CUSTOMER",
          },
        });
      } catch (error) {
        if (!(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ))
          throw error;
      }
      return NextResponse.json({
        message:
          "Jika email dapat didaftarkan, akun sudah dibuat. Silakan masuk.",
      });
    }
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
    // A valid dummy hash keeps the password derivation step for unknown accounts.
    const stored =
      user?.passwordHash ??
      "scrypt:00000000000000000000000000000000:" + "00".repeat(64);
    const valid = await verifyPassword(password, stored);
    if (!user || !valid)
      throw new HttpError(401, "Email atau password tidak sesuai.");
    await destroySession();
    await createSession(user.id);
    return NextResponse.json(
      { user: await currentUser() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
