import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db } from "./db";

const scrypt = promisify(scryptCallback);
const production = process.env.NODE_ENV === "production";
const cookieName = production
  ? "__Host-harmonika-session"
  : "harmonika-session";
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 256) {
    throw new Error(
      "Password harus minimal 12 karakter dan maksimal 256 byte.",
    );
  }
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (Buffer.byteLength(password, "utf8") > 256) return false;
  const parts = stored.split(":");
  if (
    parts.length !== 3 ||
    parts[0] !== "scrypt" ||
    !/^[a-f0-9]{32}$/.test(parts[1]) ||
    !/^[a-f0-9]{128}$/.test(parts[2])
  )
    return false;
  const expected = Buffer.from(parts[2], "hex");
  const actual = (await scrypt(password, parts[1], 64)) as Buffer;
  return timingSafeEqual(actual, expected);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionLifetime);
  await db.session.create({
    data: { userId, tokenHash: digest(token), expiresAt },
  });
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: digest(token) },
    select: {
      expiresAt: true,
      user: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
    },
  });
  return session && session.expiresAt.getTime() > Date.now()
    ? session.user
    : null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await db.session.deleteMany({ where: { tokenHash: digest(token) } });
  jar.set(cookieName, "", {
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
