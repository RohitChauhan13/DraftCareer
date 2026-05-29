ALTER TABLE "resumes" ADD COLUMN "is_pinned" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "resumes_user_id_is_pinned_updated_at_idx" ON "resumes"("user_id", "is_pinned", "updated_at");
