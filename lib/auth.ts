import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "resume_builder_session";
const encoder = new TextEncoder();

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("JWT_SECRET must be set to at least 24 characters.");
  }
  return encoder.encode(secret);
}

export async function createSession(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret());
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, jwtSecret());
    const userId = verified.payload.userId;
    if (typeof userId !== "string") return null;

    const users = await prisma.$queryRaw<Array<{
      id: string;
      isBlocked: boolean;
      emailVerified: boolean;
    }>>`
      SELECT id, is_blocked AS "isBlocked", email_verified AS "emailVerified"
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;
    const user = users[0] ?? null;
    if (!user || user.isBlocked || !user.emailVerified) {
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    return user.id;
  } catch {
    cookieStore.delete(COOKIE_NAME);
    return null;
  }
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const users = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isBlocked: boolean;
    emailVerified: boolean;
    createdAt: Date;
  }>>`
    SELECT id, name, email, role, is_blocked AS "isBlocked", email_verified AS "emailVerified", created_at AS "createdAt"
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  const user = users[0] ?? null;
  if (!user || user.isBlocked || !user.emailVerified) return null;
  return user;
}
