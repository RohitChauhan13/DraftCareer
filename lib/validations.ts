import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(80, "Name must be 80 characters or less.")
  .regex(/^[a-zA-Z][a-zA-Z\s'.-]*$/, "Name can only contain letters, spaces, apostrophes, dots, and hyphens.");

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(120, "Email must be 120 characters or less.")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password must be 100 characters or less.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.")
});

export const otpRequestSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["email_verification", "password_reset"]).default("email_verification")
});

export const otpVerifySchema = z.object({
  email: emailSchema,
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP."),
  purpose: z.enum(["email_verification", "password_reset"]).default("email_verification")
});

export const resetPasswordSchema = otpVerifySchema.extend({
  purpose: z.literal("password_reset"),
  password: passwordSchema
});

export const resumeSectionSchema = z.object({
  sectionType: z.string().min(1),
  contentJson: z.unknown()
});

export const resumePayloadSchema = z.object({
  title: z.string().trim().min(1).max(100),
  templateId: z.enum(["modern", "ats", "minimal", "developer", "classic", "executive", "timeline", "compact", "editorial", "accent", "split", "mono"]).default("modern"),
  sections: z.array(resumeSectionSchema).default([])
});
