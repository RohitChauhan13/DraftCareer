import type { HardcodedTemplateId, TemplateTag } from "@/types/resume";
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
  templateId: HardcodedTemplateId;
  tag: TemplateTag | null;
  isVisible: boolean;
  sortOrder: number;
};

type TemplateTagRow = {
  template_id: string;
  tag: string | null;
  is_visible: boolean;
  sort_order: number;
};

const defaultTags: Partial<Record<HardcodedTemplateId, TemplateTag>> = {
  ats: "popular",
  developer: "popular",
  compact: "popular"
};

const templateIds = resumeTemplates.map((template) => template.id);
const validTags = templateTagOptions.map((option) => option.value);

export async function getTemplateTagSettings(): Promise<TemplateTagSetting[]> {
  const rows = await prisma.$queryRaw<TemplateTagRow[]>`
    SELECT template_id, tag
    , is_visible, sort_order
    FROM template_tag_settings
  `;
  const byTemplate = new Map(rows.map((row) => [row.template_id, row]));

  return templateIds.map((templateId) => ({
    templateId,
    tag: normalizeTemplateTag(byTemplate.get(templateId)?.tag ?? defaultTags[templateId] ?? null),
    isVisible: byTemplate.get(templateId)?.is_visible ?? true,
    sortOrder: byTemplate.get(templateId)?.sort_order ?? resumeTemplates.findIndex((template) => template.id === templateId)
  })).sort((a, b) => a.sortOrder - b.sortOrder);
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
    await prisma.$executeRaw`
      UPDATE template_tag_settings
      SET is_visible = ${setting.isVisible}, sort_order = ${setting.sortOrder}, updated_at = CURRENT_TIMESTAMP
      WHERE template_id = ${setting.templateId}
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
