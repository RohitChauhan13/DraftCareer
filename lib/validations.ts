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

export const resumePinSchema = z.object({
  isPinned: z.boolean()
});

const themeIdSchema = z.enum(["purple", "charcoal", "taupe", "navy", "blue", "teal", "green", "orange", "red"]);
const templateIdSchema = z.enum(["modern", "ats", "minimal", "developer", "classic", "executive", "timeline", "compact", "editorial", "accent", "split", "mono"]);
const resumeSectionKeySchema = z.enum(["summary", "skills", "experience", "projects", "education", "certifications", "achievements"]);
const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

export const resumeDataSchema = z.object({
  title: z.string().trim().min(1).max(100),
  templateId: templateIdSchema,
  themeId: themeIdSchema,
  themeColor: hexColorSchema.optional(),
  textColors: z.object({
    name: hexColorSchema.optional(),
    description: hexColorSchema.optional(),
    subtitle: hexColorSchema.optional(),
    meta: hexColorSchema.optional(),
    background: hexColorSchema.optional()
  }).default({}),
  hiddenSections: z.array(resumeSectionKeySchema).default([]),
  initialsStyle: z.object({
    hidden: z.boolean().optional(),
    letterColor: hexColorSchema.optional(),
    boxColor: hexColorSchema.optional(),
    shape: z.enum(["square", "round"]).optional(),
    position: z.enum(["left", "center", "right"]).optional(),
    image: z.string().optional(),
    originalImage: z.string().optional(),
    scale: z.number().min(1).max(2.5).optional()
  }).default({}),
  personal: z.object({
    fullName: z.string().max(120).default(""),
    email: z.string().max(160).default(""),
    phone: z.string().max(80).default(""),
    location: z.string().max(160).default(""),
    linkedin: z.string().max(220).default(""),
    github: z.string().max(220).default(""),
    portfolio: z.string().max(220).default("")
  }),
  summary: z.string().max(600).default(""),
  skills: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  education: z.array(z.object({
    college: z.string().max(160).default(""),
    degree: z.string().max(160).default(""),
    cgpa: z.string().max(40).default(""),
    startDate: z.string().max(40).default(""),
    endDate: z.string().max(40).default(""),
    description: z.string().max(800).default("")
  })).max(12).default([]),
  experience: z.array(z.object({
    company: z.string().max(160).default(""),
    role: z.string().max(160).default(""),
    startDate: z.string().max(40).default(""),
    endDate: z.string().max(40).default(""),
    current: z.boolean().default(false),
    description: z.string().max(1200).default("")
  })).max(20).default([]),
  projects: z.array(z.object({
    name: z.string().max(160).default(""),
    description: z.string().max(1200).default(""),
    technologies: z.string().max(400).default(""),
    github: z.string().max(220).default(""),
    live: z.string().max(220).default("")
  })).max(20).default([]),
  certifications: z.array(z.object({
    name: z.string().max(160).default(""),
    provider: z.string().max(160).default(""),
    date: z.string().max(40).default(""),
    description: z.string().max(800).default("")
  })).max(20).default([]),
  achievements: z.array(z.object({
    title: z.string().max(160).default(""),
    description: z.string().max(800).default("")
  })).max(20).default([])
});

export const resumeEnhanceSchema = z.object({
  resume: resumeDataSchema
});

export const aiEnhanceSettingsSchema = z.object({
  limitPerUser: z.number().int().min(0).max(1000)
});

export const userAiEnhanceSchema = z.object({
  aiEnhanceBlocked: z.boolean().optional(),
  resetCount: z.boolean().optional()
}).refine((value) => value.aiEnhanceBlocked !== undefined || value.resetCount === true, {
  message: "Send an enhancement block state or resetCount."
});

export const donationSettingsSchema = z.object({
  isPageVisible: z.boolean().optional(),
  upiId: z
    .string()
    .trim()
    .min(3, "UPI ID is required.")
    .max(80, "UPI ID must be 80 characters or less.")
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, "Enter a valid UPI ID, for example name@ybl.")
    .optional(),
  isQrVisible: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: "Send at least one setting to update."
});

export const templateTagSettingsSchema = z.object({
  settings: z.array(z.object({
    templateId: z.enum(["modern", "ats", "minimal", "developer", "classic", "executive", "timeline", "compact", "editorial", "accent", "split", "mono"]),
    tag: z.enum(["popular", "latest", "new", "trending", "recommended"]).nullable(),
    isVisible: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(1000).default(0)
  }))
});
