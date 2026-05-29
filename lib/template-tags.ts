import type { TemplateId, TemplateTag } from "@/types/resume";
import { prisma } from "@/lib/prisma";
import { resumeTemplates } from "@/templates/resume-options";

export const templateTagOptions: { value: TemplateTag; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "latest", label: "Latest" },
  { value: "new", label: "New" },
  { value: "trending", label: "Trending" },
  { value: "recommended", label: "Recommended" }
];

export type TemplateTagSetting = {
  templateId: TemplateId;
  tag: TemplateTag | null;
};

type TemplateTagRow = {
  template_id: string;
  tag: string | null;
};

const defaultTags: Partial<Record<TemplateId, TemplateTag>> = {
  ats: "popular",
  developer: "popular",
  compact: "popular"
};

const templateIds = resumeTemplates.map((template) => template.id);
const validTags = templateTagOptions.map((option) => option.value);

export async function getTemplateTagSettings(): Promise<TemplateTagSetting[]> {
  const rows = await prisma.$queryRaw<TemplateTagRow[]>`
    SELECT template_id, tag
    FROM template_tag_settings
  `;
  const byTemplate = new Map(rows.map((row) => [row.template_id, row.tag]));

  return templateIds.map((templateId) => ({
    templateId,
    tag: normalizeTemplateTag(byTemplate.get(templateId) ?? defaultTags[templateId] ?? null)
  }));
}

export async function updateTemplateTagSettings(settings: TemplateTagSetting[]) {
  for (const setting of settings) {
    await prisma.$executeRaw`
      INSERT INTO template_tag_settings (template_id, tag, updated_at)
      VALUES (${setting.templateId}, ${setting.tag}, CURRENT_TIMESTAMP)
      ON CONFLICT (template_id) DO UPDATE SET
        tag = EXCLUDED.tag,
        updated_at = CURRENT_TIMESTAMP
    `;
  }

  return getTemplateTagSettings();
}

export function templateTagLabel(tag: TemplateTag) {
  return templateTagOptions.find((option) => option.value === tag)?.label ?? tag;
}

export function normalizeTemplateTag(value: unknown): TemplateTag | null {
  return typeof value === "string" && validTags.includes(value as TemplateTag)
    ? (value as TemplateTag)
    : null;
}
