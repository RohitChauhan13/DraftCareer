import { NextRequest } from "next/server";
import { errorResponse, ok } from "@/lib/api";
import { getSessionUserId } from "@/lib/auth";
import { getAiEnhanceDateKey, getAiEnhanceSettings, getUserAiEnhanceUsage } from "@/lib/ai-enhance";
import { enhanceResumeWithGemini, enhanceResumeWithGeminiModelIndex, getGeminiModelCount, isRetryableGeminiError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { resumeEnhanceSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const access = await getEnhanceAccess(userId);
    if (!access.allowed) return errorResponse(new Error(access.reason), 403);

    const payload = resumeEnhanceSchema.parse(await request.json());
    let resume;
    try {
      resume = typeof payload.modelIndex === "number"
        ? await enhanceResumeWithGeminiModelIndex(payload.resume, payload.modelIndex, payload.jobRequirement)
        : await enhanceResumeWithGemini(payload.resume, payload.jobRequirement);
    } catch (error) {
      if (typeof payload.modelIndex === "number" && error instanceof Error && isRetryableGeminiError(error)) {
        const nextModelIndex = payload.modelIndex + 1;
        if (nextModelIndex < getGeminiModelCount()) {
          return ok({
            error: `Model ${payload.modelIndex + 1} could not improve the resume. Trying Model ${nextModelIndex + 1}.`,
            retryable: true,
            nextModelIndex
          }, { status: 503 });
        }
        return errorResponse(new Error("AI could not produce useful resume improvements right now. Please try again later."), 429);
      }
      throw error;
    }
    const usage = await recordEnhancement(userId);

    return ok({ resume, usage });
  } catch (error) {
    return errorResponse(error);
  }
}

async function getEnhanceAccess(userId: string): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const users = await prisma.$queryRaw<Array<{
    role: string;
    aiEnhanceDailyCount: number;
    aiEnhanceDailyDate: string | null;
    aiEnhanceBlocked: boolean;
  }>>`
    SELECT
      role,
      ai_enhance_daily_count AS "aiEnhanceDailyCount",
      ai_enhance_daily_date AS "aiEnhanceDailyDate",
      ai_enhance_blocked AS "aiEnhanceBlocked"
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  const user = users[0];
  if (!user) return { allowed: false, reason: "Unauthorized" };
  if (user.role === "admin") return { allowed: true };
  if (user.aiEnhanceBlocked) return { allowed: false, reason: "AI enhancement is blocked for your account." };

  const settings = await getAiEnhanceSettings();
  const today = getAiEnhanceDateKey();
  const dailyUsed = user.aiEnhanceDailyDate === today ? user.aiEnhanceDailyCount : 0;
  if (dailyUsed >= settings.limitPerUser) {
    return { allowed: false, reason: "You have used all AI enhancement chances for today." };
  }

  return { allowed: true };
}

async function recordEnhancement(userId: string) {
  const today = getAiEnhanceDateKey();
  await prisma.$queryRaw`
    UPDATE users
    SET ai_enhance_count = CASE WHEN role = 'admin' THEN ai_enhance_count ELSE ai_enhance_count + 1 END,
        ai_enhance_daily_count = CASE
          WHEN role = 'admin' THEN ai_enhance_daily_count
          WHEN ai_enhance_daily_date = ${today} THEN ai_enhance_daily_count + 1
          ELSE 1
        END,
        ai_enhance_daily_date = CASE WHEN role = 'admin' THEN ai_enhance_daily_date ELSE ${today} END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${userId}
  `;
  return getUserAiEnhanceUsage(userId);
}
