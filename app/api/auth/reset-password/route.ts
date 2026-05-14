import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, errorResponse } from "@/lib/api";
import { hashSecret } from "@/lib/password";
import { verifyOtp } from "@/lib/otp";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const payload = resetPasswordSchema.parse(await request.json());
    const verified = await verifyOtp(payload.email, payload.otp, "password_reset");
    if (!verified) throw new Error("Invalid or expired OTP.");

    await prisma.user.update({
      where: { email: payload.email },
      data: { passwordHash: await hashSecret(payload.password) }
    });

    return ok({ message: "Password reset successfully." });
  } catch (error) {
    return errorResponse(error);
  }
}
