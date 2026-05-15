-- CreateTable
CREATE TABLE "donation_settings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "is_page_visible" BOOLEAN NOT NULL DEFAULT true,
    "upi_id" TEXT NOT NULL DEFAULT 'example@ybl',
    "is_qr_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_settings_pkey" PRIMARY KEY ("id")
);

-- Seed singleton settings row
INSERT INTO "donation_settings" ("id", "is_page_visible", "upi_id", "is_qr_visible", "updated_at")
VALUES ('main', true, 'example@ybl', true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
