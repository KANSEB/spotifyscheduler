import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "kore_session";

function secret(): string {
  return process.env.ADMIN_PASSWORD || "";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret() || "kore-dev-secret").update(value).digest("hex");
}

/** Jeton = HMAC d'une constante avec le mot de passe admin comme clé. */
function token(): string {
  return sign("kore-admin-v1");
}

export function checkPassword(input: string): boolean {
  const expected = secret();
  if (!expected) return false;
  const a = Buffer.from(input || "");
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  if (!secret()) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  const expected = token();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function adminConfigured(): boolean {
  return Boolean(secret());
}
