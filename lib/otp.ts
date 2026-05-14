import { prisma } from "@/lib/prisma";
import { hashSecret, verifySecret } from "@/lib/password";

export type OtpPurpose = "email_verification" | "password_reset";

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(email: string, purpose: OtpPurpose) {
  const recent = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose,
      createdAt: { gt: new Date(Date.now() - 60_000) }
    },
    orderBy: { createdAt: "desc" }
  });

  if (recent) {
    throw new Error("Please wait before requesting another OTP.");
  }

  const otp = generateOtp();
  await prisma.otpVerification.create({
    data: {
      email,
      purpose,
      otpHash: await hashSecret(otp),
      expiresAt: new Date(Date.now() + 5 * 60_000)
    }
  });

  return otp;
}

export async function verifyOtp(email: string, otp: string, purpose: OtpPurpose) {
  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      purpose,
      verified: false
    },
    orderBy: { createdAt: "desc" }
  });

  if (!record || record.expiresAt < new Date()) return false;
  if (record.attempts >= 5) return false;

  const valid = await verifySecret(otp, record.otpHash);
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: {
      attempts: { increment: 1 },
      verified: valid ? true : record.verified
    }
  });

  return valid;
}
