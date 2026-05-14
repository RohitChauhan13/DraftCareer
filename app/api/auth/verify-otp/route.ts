import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, errorResponse } from "@/lib/api";
import { createSession, setSessionCookie } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { otpVerifySchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const payload = otpVerifySchema.parse(await request.json());
    const verified = await verifyOtp(payload.email, payload.otp, payload.purpose);
    if (!verified) throw new Error("Invalid or expired OTP.");

    if (payload.purpose === "email_verification") {
      const user = await prisma.user.update({
        where: { email: payload.email },
        data: { emailVerified: true },
        select: { id: true, name: true, email: true, emailVerified: true }
      });
      await setSessionCookie(await createSession(user.id));
      return ok({ user, message: "Email verified." });
    }

    return ok({ message: "OTP verified." });
  } catch (error) {
    return errorResponse(error);
  }
}
