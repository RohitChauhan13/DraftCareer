import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, errorResponse } from "@/lib/api";
import { signupSchema } from "@/lib/validations";
import { hashSecret } from "@/lib/password";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const payload = signupSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) throw new Error("An account with this email already exists.");

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash: await hashSecret(payload.password)
      },
      select: { id: true, name: true, email: true, emailVerified: true }
    });

    const otp = await createOtp(payload.email, "email_verification");
    void sendOtpEmail({ email: payload.email, otp, purpose: "email_verification" }).catch((error) => {
      console.error("Unable to send signup OTP email", error);
    });

    return ok({ user, message: "Account created. Check your email for the OTP." }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
