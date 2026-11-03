import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function assertOrigin(request: NextRequest) {
  const configured = process.env.APP_ORIGIN;
  if (!configured)
    throw new HttpError(503, "Konfigurasi aplikasi belum lengkap.");
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(configured).origin) {
    throw new HttpError(403, "Asal request tidak diizinkan.");
  }
}

export async function readJson(request: NextRequest): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  ) {
    throw new HttpError(415, "Gunakan application/json.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Body diperlukan.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) {
        await reader.cancel();
        throw new HttpError(413, "Request terlalu besar.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "JSON tidak valid.");
  }
}

export async function rateLimit(
  scope: string,
  identifier: string,
  maximum: number,
  windowMs: number,
) {
  const key = createHash("sha256")
    .update(`${scope}:${identifier}`)
    .digest("hex");
  const now = new Date();
  const resetsAt = new Date(now.getTime() + windowMs);
  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("key", "count", "resetsAt")
    VALUES (${key}, 1, ${resetsAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetsAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetsAt" = CASE WHEN "RateLimit"."resetsAt" <= ${now} THEN ${resetsAt} ELSE "RateLimit"."resetsAt" END
    RETURNING "count"
  `;
  if (!rows[0] || rows[0].count > maximum)
    throw new HttpError(429, "Terlalu banyak percobaan. Coba lagi nanti.");
}

export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return NextResponse.json(
      { error: "Silakan masuk terlebih dahulu." },
      { status: 401 },
    );
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  return NextResponse.json(
    { error: "Permintaan belum dapat diproses." },
    { status: 500 },
  );
}
