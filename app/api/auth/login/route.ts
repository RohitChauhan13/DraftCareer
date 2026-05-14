import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, errorResponse } from "@/lib/api";
import { createSession, setSessionCookie } from "@/lib/auth";
import { verifySecret } from "@/lib/password";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const payload = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user || !(await verifySecret(payload.password, user.passwordHash))) {
      throw new Error("Invalid email or password.");
    }
    if (!user.emailVerified) throw new Error("Please verify your email before logging in.");

    await setSessionCookie(await createSession(user.id));
    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
