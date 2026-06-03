import { NextRequest } from "next/server";
import { errorResponse, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getAiEnhanceSettings, updateAiEnhanceSettings } from "@/lib/ai-enhance";
import { aiEnhanceSettingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    const settings = await getAiEnhanceSettings();
    return ok({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") return errorResponse(new Error("Unauthorized"), 401);

    const payload = aiEnhanceSettingsSchema.parse(await request.json());
    const settings = await updateAiEnhanceSettings(payload);
    return ok({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
