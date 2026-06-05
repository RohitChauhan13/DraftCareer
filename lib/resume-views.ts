import { createHash, randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const RESUME_VIEWER_COOKIE = "draftcareer_viewer_id";

type PrismaTransaction = Prisma.TransactionClient;

export async function recordResumeView(resumeId: string) {
  const viewerKey = await getViewerKey();
  if (!viewerKey) {
    return prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        title: true,
        templateId: true,
        isPublic: true,
        viewCount: true
      }
    });
  }

  return prisma.$transaction(async (tx) => {
    const inserted = await recordViewerVisit(tx, resumeId, viewerKey);
    if (!inserted) {
      return tx.resume.findUnique({
        where: { id: resumeId },
        select: {
          id: true,
          title: true,
          templateId: true,
          isPublic: true,
          viewCount: true
        }
      });
    }

    return tx.resume.update({
      where: { id: resumeId },
      data: { viewCount: { increment: 1 } },
      select: {
        id: true,
        title: true,
        templateId: true,
        isPublic: true,
        viewCount: true
      }
    });
  });
}

async function recordViewerVisit(tx: PrismaTransaction, resumeId: string, viewerKey: string) {
  const viewId = randomBytes(16).toString("hex");
  const rows = await tx.$queryRaw<Array<{ wasInserted: boolean }>>`
    WITH inserted AS (
      INSERT INTO resume_views (id, resume_id, viewer_key, visit_count)
      VALUES (${viewId}, ${resumeId}, ${viewerKey}, 1)
      ON CONFLICT (resume_id, viewer_key) DO NOTHING
      RETURNING id
    ),
    updated AS (
      UPDATE resume_views
      SET visit_count = visit_count + 1, last_viewed_at = CURRENT_TIMESTAMP
      WHERE resume_id = ${resumeId}
        AND viewer_key = ${viewerKey}
        AND NOT EXISTS (SELECT 1 FROM inserted)
      RETURNING id
    )
    SELECT EXISTS(SELECT 1 FROM inserted) AS "wasInserted"
  `;

  return rows[0]?.wasInserted ?? false;
}

async function getViewerKey() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const deviceId = cookieStore.get(RESUME_VIEWER_COOKIE)?.value;
  const ipAddress = getClientIp(headerStore);
  const userAgent = headerStore.get("user-agent") ?? "";

  if (!deviceId && !ipAddress && !userAgent) return null;

  const salt = process.env.VIEWER_HASH_SECRET ?? process.env.JWT_SECRET ?? "draftcareer-view-v1";
  const viewerIdentity = ipAddress
    ? ["ip-user-agent", ipAddress, userAgent].join("|")
    : ["device-user-agent", deviceId ?? "no-device", userAgent].join("|");

  return createHash("sha256")
    .update([salt, viewerIdentity].join("|"))
    .digest("hex");
}

function getClientIp(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;

  return headerStore.get("x-real-ip") ?? headerStore.get("cf-connecting-ip");
}
