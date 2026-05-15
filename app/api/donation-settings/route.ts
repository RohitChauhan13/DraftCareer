import { NextRequest } from "next/server";
import { errorResponse, ok } from "@/lib/api";
import { getDonationSettings, updateDonationSettings } from "@/lib/donation";
import { getCurrentUser } from "@/lib/auth";
import { donationSettingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    const settings = await getDonationSettings();
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

    const payload = donationSettingsSchema.parse(await request.json());
    const settings = await updateDonationSettings(payload);
    return ok({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
