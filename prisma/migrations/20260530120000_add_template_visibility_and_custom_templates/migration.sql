ALTER TABLE "template_tag_settings"
ADD COLUMN "is_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "custom_resume_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "markup_html" TEXT NOT NULL,
  "custom_css" TEXT NOT NULL,
  "is_visible" BOOLEAN NOT NULL DEFAULT false,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "custom_resume_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "custom_resume_templates_slug_key" ON "custom_resume_templates"("slug");
CREATE INDEX "custom_resume_templates_is_visible_is_archived_sort_order_idx" ON "custom_resume_templates"("is_visible", "is_archived", "sort_order");
