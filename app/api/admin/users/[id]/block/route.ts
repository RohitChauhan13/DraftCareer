import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const blockSchema = z.object({
  isBlocked: z.boolean()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "admin") return errorResponse(new Error("Unauthorized"), 401);

    const { id } = await params;
    if (id === admin.id) return errorResponse(new Error("You cannot block your own admin account."), 400);

    const payload = blockSchema.parse(await request.json());
    const users = await prisma.$queryRaw<Array<{ id: string; isBlocked: boolean }>>`
      UPDATE users
      SET is_blocked = ${payload.isBlocked}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, is_blocked AS "isBlocked"
    `;
    const user = users[0];
    if (!user) return errorResponse(new Error("User not found."), 404);

    return ok({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
