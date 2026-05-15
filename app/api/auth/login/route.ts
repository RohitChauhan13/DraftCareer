import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, errorResponse } from "@/lib/api";
import { createSession, setSessionCookie } from "@/lib/auth";
import { verifySecret } from "@/lib/password";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const payload = loginSchema.parse(await request.json());
    const users = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      email: string;
      passwordHash: string;
      role: string;
      isBlocked: boolean;
      emailVerified: boolean;
    }>>`
      SELECT
        id,
        name,
        email,
        password_hash AS "passwordHash",
        role,
        is_blocked AS "isBlocked",
        email_verified AS "emailVerified"
      FROM users
      WHERE email = ${payload.email}
      LIMIT 1
    `;
    const user = users[0];
    if (!user || !(await verifySecret(payload.password, user.passwordHash))) {
      throw new Error("Invalid email or password.");
    }
    if (user.isBlocked) throw new Error("This account has been blocked. Please contact the admin.");
    if (!user.emailVerified) throw new Error("Please verify your email before logging in.");

    await setSessionCookie(await createSession(user.id));
    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? "user",
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
