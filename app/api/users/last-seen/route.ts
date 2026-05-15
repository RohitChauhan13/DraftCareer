import { errorResponse, ok } from "@/lib/api";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    await prisma.$executeRaw`
      UPDATE users
      SET last_seen_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;

    return ok({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
