import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, ok } from "@/lib/api";
import { getSessionUserId } from "@/lib/auth";
import { resumePayloadSchema } from "@/lib/validations";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" }
      ],
      include: { sections: true }
    });

    return ok({ resumes });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return errorResponse(new Error("Unauthorized"), 401);

    const payload = resumePayloadSchema.parse(await request.json());
    const resume = await prisma.resume.create({
      data: {
        userId,
        title: payload.title,
        templateId: payload.templateId,
        sections: {
          create: payload.sections.map((section) => ({
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
