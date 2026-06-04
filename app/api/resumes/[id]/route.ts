import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, ok } from "@/lib/api";
import { getSessionUserId } from "@/lib/auth";
import { resumePayloadSchema, resumePinSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId },
      include: { sections: true }
    });
    if (!resume) return errorResponse(new Error("Resume not found."), 404);

    return ok({ resume });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const { id } = await params;
    const payload = resumePayloadSchema.parse(await request.json());
    const existing = await prisma.resume.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse(new Error("Resume not found."), 404);

    await prisma.$transaction([
      prisma.resume.update({
        where: { id },
        data: { title: payload.title, templateId: payload.templateId }
      }),
      ...payload.sections.map((section) => (
        prisma.resumeSection.upsert({
          where: { resumeId_sectionType: { resumeId: id, sectionType: section.sectionType } },
          update: { contentJson: section.contentJson as Prisma.InputJsonValue },
          create: {
            resumeId: id,
            sectionType: section.sectionType,
            contentJson: section.contentJson as Prisma.InputJsonValue
          }
        })
      ))
    ]);

    const resume = await prisma.resume.findUniqueOrThrow({ where: { id }, include: { sections: true } });

    return ok({ resume });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const { id } = await params;
    const payload = resumePinSchema.parse(await request.json());
    const existing = await prisma.resume.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse(new Error("Resume not found."), 404);

    await prisma.$executeRaw`
      UPDATE resumes
      SET is_pinned = ${payload.isPinned}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;

    const resume = await prisma.resume.findUniqueOrThrow({ where: { id } });

    return ok({ resume });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const { id } = await params;
    const existing = await prisma.resume.findFirst({ where: { id, userId } });
    if (!existing) return errorResponse(new Error("Resume not found."), 404);

    await prisma.resume.delete({ where: { id } });
    return ok({ message: "Resume deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
