import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "main";
const DEFAULT_UPI_ID = "example@ybl";

type DonationSettingsRow = {
  is_page_visible: boolean;
  upi_id: string;
  is_qr_visible: boolean;
  updated_at: Date;
};

export type DonationSettings = {
  isPageVisible: boolean;
  upiId: string;
  isQrVisible: boolean;
  upiUrl: string;
  qrUrl: string;
  updatedAt: Date;
};

export function createUpiUrl(upiId: string, amount?: number) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: "DraftCareer",
    tn: "Donate to DraftCareer",
    cu: "INR"
  });
  if (amount) params.set("am", amount.toFixed(2));
  return `upi://pay?${params.toString()}`;
}

export function createQrUrl(upiUrl: string) {
  const params = new URLSearchParams({
    size: "320x320",
    margin: "12",
    data: upiUrl
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export async function getDonationSettings(): Promise<DonationSettings> {
  const rows = await prisma.$queryRaw<DonationSettingsRow[]>`
    SELECT is_page_visible, upi_id, is_qr_visible, updated_at
    FROM donation_settings
    WHERE id = ${SETTINGS_ID}
    LIMIT 1
  `;
  const row = rows[0] ?? await createDefaultDonationSettings();
  return toDonationSettings(row);
}

export async function updateDonationSettings(input: {
  isPageVisible?: boolean;
  upiId?: string;
  isQrVisible?: boolean;
}) {
  const current = await getDonationSettings();
  const next = {
    isPageVisible: input.isPageVisible ?? current.isPageVisible,
    upiId: input.upiId ?? current.upiId,
    isQrVisible: input.isQrVisible ?? current.isQrVisible
  };

  const rows = await prisma.$queryRaw<DonationSettingsRow[]>`
    INSERT INTO donation_settings (id, is_page_visible, upi_id, is_qr_visible, updated_at)
    VALUES (${SETTINGS_ID}, ${next.isPageVisible}, ${next.upiId}, ${next.isQrVisible}, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      is_page_visible = EXCLUDED.is_page_visible,
      upi_id = EXCLUDED.upi_id,
      is_qr_visible = EXCLUDED.is_qr_visible,
      updated_at = CURRENT_TIMESTAMP
    RETURNING is_page_visible, upi_id, is_qr_visible, updated_at
  `;

  return toDonationSettings(rows[0]);
}

async function createDefaultDonationSettings() {
  const rows = await prisma.$queryRaw<DonationSettingsRow[]>`
    INSERT INTO donation_settings (id, is_page_visible, upi_id, is_qr_visible, updated_at)
    VALUES (${SETTINGS_ID}, true, ${DEFAULT_UPI_ID}, true, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
    RETURNING is_page_visible, upi_id, is_qr_visible, updated_at
  `;
  return rows[0];
}

function toDonationSettings(row: DonationSettingsRow): DonationSettings {
  const upiUrl = createUpiUrl(row.upi_id);
  return {
    isPageVisible: row.is_page_visible,
    upiId: row.upi_id,
    isQrVisible: row.is_qr_visible,
    upiUrl,
    qrUrl: createQrUrl(upiUrl),
    updatedAt: row.updated_at
  };
}
