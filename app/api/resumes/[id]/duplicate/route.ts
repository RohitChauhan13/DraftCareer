import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, ok } from "@/lib/api";
import { getSessionUserId } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const { id } = await params;
    const source = await prisma.resume.findFirst({
      where: { id, userId },
      include: {
        sections: {
          select: {
            sectionType: true,
            contentJson: true
          }
        }
      }
    });
    if (!source) return errorResponse(new Error("Resume not found."), 404);

    const resume = await prisma.resume.create({
      data: {
        userId,
        title: `${source.title} Copy`,
        templateId: source.templateId,
        sections: {
          create: source.sections.map((section) => ({
            sectionType: section.sectionType,
            contentJson: section.contentJson as Prisma.InputJsonValue
          }))
        }
      },
      include: { sections: true }
    });

    return ok({ resume }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
