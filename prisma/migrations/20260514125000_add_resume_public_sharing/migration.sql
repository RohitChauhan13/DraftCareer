-- AlterTable
ALTER TABLE "resumes" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "share_slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "resumes_share_slug_key" ON "resumes"("share_slug");
