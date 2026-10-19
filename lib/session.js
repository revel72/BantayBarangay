import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

const COOKIE = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 16 ? s : null;
}

function sign(data, key) {
  return createHmac("sha256", key).update(data).digest("base64url");
}

function sha(value) {
  return createHash("sha256").update(String(value)).digest();
}

// Constant-time check of the submitted login against ADMIN_USERNAME / ADMIN_PASSWORD.
export function credentialsMatch(username, password) {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  const userOk = timingSafeEqual(sha(username), sha(u));
  const passOk = timingSafeEqual(sha(password), sha(p));
  return userOk && passOk;
}

export function authConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && secret());
}

export async function createSession(username) {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is missing or too short");
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  ).toString("base64url");
  const token = `${payload}.${sign(payload, key)}`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession() {
  const key = secret();
  if (!key) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload, key));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Checking expiry uses the current time, so make sure this runs at request time.
  await connection();

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
