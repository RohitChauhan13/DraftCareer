import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, errorResponse } from "@/lib/api";
import { sendOtpEmail } from "@/lib/email";
import { createOtp } from "@/lib/otp";
import { otpRequestSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const payload = otpRequestSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (user) {
      const otp = await createOtp(payload.email, "password_reset");
      void sendOtpEmail({ email: payload.email, otp, purpose: "password_reset" }).catch((error) => {
        console.error("Unable to send password reset OTP email", error);
      });
    }
    return ok({ message: "If the account exists, a reset OTP has been sent." });
  } catch (error) {
    return errorResponse(error);
  }
}
