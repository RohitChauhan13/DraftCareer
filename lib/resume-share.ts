import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export type ResumeShareInfo = {
  isPublic: boolean;
  shareSlug: string | null;
  viewCount: number;
};

type ShareRow = {
  is_public: boolean;
  share_slug: string | null;
  view_count: number;
};

export async function getResumeShareInfo(resumeId: string): Promise<ResumeShareInfo> {
  const rows = await prisma.$queryRaw<ShareRow[]>`
    SELECT is_public, share_slug, view_count
    FROM resumes
    WHERE id = ${resumeId}
    LIMIT 1
  `;
  return toShareInfo(rows[0]);
}

export async function setResumePublicState({
  resumeId,
  userId,
  isPublic
}: {
  resumeId: string;
  userId: string;
  isPublic: boolean;
}) {
  const existingRows = await prisma.$queryRaw<Array<ShareRow & { id: string }>>`
    SELECT id, is_public, share_slug, view_count
    FROM resumes
    WHERE id = ${resumeId} AND user_id = ${userId}
    LIMIT 1
  `;
  const existing = existingRows[0];
  if (!existing) return null;

  const shareSlug = existing.share_slug ?? (isPublic ? await createUniqueSlug() : null);
  const rows = await prisma.$queryRaw<ShareRow[]>`
    UPDATE resumes
    SET is_public = ${isPublic}, share_slug = ${shareSlug}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${resumeId} AND user_id = ${userId}
    RETURNING is_public, share_slug, view_count
  `;

  return toShareInfo(rows[0]);
}

async function createUniqueSlug() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = randomBytes(8).toString("hex");
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM resumes WHERE share_slug = ${slug} LIMIT 1
    `;
    if (rows.length === 0) return slug;
  }
  throw new Error("Unable to create share link.");
}

function toShareInfo(row?: ShareRow): ResumeShareInfo {
  return {
    isPublic: row?.is_public ?? false,
    shareSlug: row?.share_slug ?? null,
    viewCount: row?.view_count ?? 0
  };
}
