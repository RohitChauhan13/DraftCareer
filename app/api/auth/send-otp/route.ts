import { NextRequest } from "next/server";
import { ok, errorResponse } from "@/lib/api";
import { sendOtpEmail } from "@/lib/email";
import { createOtp } from "@/lib/otp";
import { otpRequestSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const payload = otpRequestSchema.parse(await request.json());
    const otp = await createOtp(payload.email, payload.purpose);
    void sendOtpEmail({ email: payload.email, otp, purpose: payload.purpose }).catch((error) => {
      console.error("Unable to send OTP email", error);
    });
    return ok({ message: "OTP sent." });
  } catch (error) {
    return errorResponse(error);
  }
}
