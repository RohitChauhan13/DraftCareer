import { NextRequest } from "next/server";
import { errorResponse, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getTemplateTagSettings, updateTemplateTagSettings } from "@/lib/template-tags";
import { templateTagSettingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    const settings = await getTemplateTagSettings();
    return ok({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return errorResponse(new Error("Unauthorized"), 401);
    }

    const payload = templateTagSettingsSchema.parse(await request.json());
    const settings = await updateTemplateTagSettings(payload.settings);
    return ok({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
