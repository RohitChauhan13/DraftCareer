CREATE TABLE "template_tag_settings" (
  "template_id" TEXT NOT NULL,
  "tag" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "template_tag_settings_pkey" PRIMARY KEY ("template_id")
);

INSERT INTO "template_tag_settings" ("template_id", "tag", "updated_at")
VALUES
  ('modern', NULL, CURRENT_TIMESTAMP),
  ('ats', 'popular', CURRENT_TIMESTAMP),
  ('minimal', NULL, CURRENT_TIMESTAMP),
  ('developer', 'popular', CURRENT_TIMESTAMP),
  ('classic', NULL, CURRENT_TIMESTAMP),
  ('executive', NULL, CURRENT_TIMESTAMP),
  ('timeline', NULL, CURRENT_TIMESTAMP),
  ('compact', 'popular', CURRENT_TIMESTAMP),
  ('editorial', NULL, CURRENT_TIMESTAMP),
  ('accent', NULL, CURRENT_TIMESTAMP),
  ('split', NULL, CURRENT_TIMESTAMP),
  ('mono', NULL, CURRENT_TIMESTAMP)
ON CONFLICT ("template_id") DO NOTHING;
