import { NextRequest } from "next/server";
import { errorResponse, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse(new Error("Unauthorized"), 401);
    if (user.role !== "admin") return errorResponse(new Error("Forbidden"), 403);

    const { id } = await params;
    if (!id) return errorResponse(new Error("Feedback id is required."), 400);

    await prisma.$queryRaw`
      DELETE FROM feedback
      WHERE id = ${id}
    `;

    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
