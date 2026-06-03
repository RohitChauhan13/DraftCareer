import { NextRequest } from "next/server";
import { errorResponse, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userAiEnhanceSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "admin") return errorResponse(new Error("Unauthorized"), 401);

    const { id } = await params;
    const payload = userAiEnhanceSchema.parse(await request.json());
    const users = await prisma.$queryRaw<Array<{
      id: string;
      aiEnhanceCount: number;
      aiEnhanceDailyCount: number;
      aiEnhanceBlocked: boolean;
    }>>`
      UPDATE users
      SET
        ai_enhance_daily_count = CASE WHEN ${payload.resetCount === true} THEN 0 ELSE ai_enhance_daily_count END,
        ai_enhance_blocked = COALESCE(${payload.aiEnhanceBlocked ?? null}, ai_enhance_blocked),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND role <> 'admin'
      RETURNING
        id,
        ai_enhance_count AS "aiEnhanceCount",
        ai_enhance_daily_count AS "aiEnhanceDailyCount",
        ai_enhance_blocked AS "aiEnhanceBlocked"
    `;
    const user = users[0];
    if (!user) return errorResponse(new Error("User not found."), 404);

    return ok({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
