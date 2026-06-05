CREATE TABLE "resume_views" (
  "id" TEXT NOT NULL,
  "resume_id" TEXT NOT NULL,
  "viewer_key" TEXT NOT NULL,
  "visit_count" INTEGER NOT NULL DEFAULT 1,
  "first_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "resume_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resume_views_resume_id_viewer_key_key" ON "resume_views"("resume_id", "viewer_key");
CREATE INDEX "resume_views_resume_id_idx" ON "resume_views"("resume_id");

ALTER TABLE "resume_views"
ADD CONSTRAINT "resume_views_resume_id_fkey"
FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
