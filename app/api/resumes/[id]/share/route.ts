import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { getSessionUserId } from "@/lib/auth";
import { setResumePublicState } from "@/lib/resume-share";

type Params = { params: Promise<{ id: string }> };

const shareSchema = z.object({
  isPublic: z.boolean()
});

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const { id } = await params;
    const payload = shareSchema.parse(await request.json());
    const share = await setResumePublicState({ resumeId: id, userId, isPublic: payload.isPublic });
    if (!share) return errorResponse(new Error("Resume not found."), 404);

    return ok({ share });
  } catch (error) {
    return errorResponse(error);
  }
}
