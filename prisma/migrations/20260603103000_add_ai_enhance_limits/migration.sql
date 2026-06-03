ALTER TABLE "users"
ADD COLUMN "ai_enhance_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "ai_enhance_blocked" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ai_enhance_settings" (
  "id" TEXT NOT NULL DEFAULT 'main',
  "limit_per_user" INTEGER NOT NULL DEFAULT 3,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_enhance_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ai_enhance_settings" ("id", "limit_per_user", "updated_at")
VALUES ('main', 3, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
