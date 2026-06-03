import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "main";
const DEFAULT_LIMIT_PER_USER = 3;

type AiEnhanceSettingsRow = {
  limit_per_user: number;
  updated_at: Date;
};

export type AiEnhanceSettings = {
  limitPerUser: number;
  updatedAt: Date;
};

export type AiEnhanceUsage = {
  used: number;
  totalUsed: number;
  limit: number;
  remaining: number | null;
  blocked: boolean;
  date: string;
};

export async function getAiEnhanceSettings(): Promise<AiEnhanceSettings> {
  const rows = await prisma.$queryRaw<AiEnhanceSettingsRow[]>`
    SELECT limit_per_user, updated_at
    FROM ai_enhance_settings
    WHERE id = ${SETTINGS_ID}
    LIMIT 1
  `;
  const row = rows[0] ?? await createDefaultAiEnhanceSettings();
  return toAiEnhanceSettings(row);
}

export async function updateAiEnhanceSettings(input: { limitPerUser: number }) {
  const rows = await prisma.$queryRaw<AiEnhanceSettingsRow[]>`
    INSERT INTO ai_enhance_settings (id, limit_per_user, updated_at)
    VALUES (${SETTINGS_ID}, ${input.limitPerUser}, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      limit_per_user = EXCLUDED.limit_per_user,
      updated_at = CURRENT_TIMESTAMP
    RETURNING limit_per_user, updated_at
  `;

  return toAiEnhanceSettings(rows[0]);
}

export async function getUserAiEnhanceUsage(userId: string): Promise<AiEnhanceUsage> {
  const [settings, users] = await Promise.all([
    getAiEnhanceSettings(),
    prisma.$queryRaw<Array<{
      role: string;
      aiEnhanceCount: number;
      aiEnhanceDailyCount: number;
      aiEnhanceDailyDate: string | null;
      aiEnhanceBlocked: boolean;
    }>>`
      SELECT
        role,
        ai_enhance_count AS "aiEnhanceCount",
        ai_enhance_daily_count AS "aiEnhanceDailyCount",
        ai_enhance_daily_date AS "aiEnhanceDailyDate",
        ai_enhance_blocked AS "aiEnhanceBlocked"
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `
  ]);
  const user = users[0];
  const today = getAiEnhanceDateKey();
  const dailyUsed = user?.aiEnhanceDailyDate === today ? user.aiEnhanceDailyCount : 0;

  return {
    used: dailyUsed,
    totalUsed: user?.aiEnhanceCount ?? 0,
    limit: settings.limitPerUser,
    remaining: user?.role === "admin" ? null : Math.max(settings.limitPerUser - dailyUsed, 0),
    blocked: user?.role === "admin" ? false : Boolean(user?.aiEnhanceBlocked),
    date: today
  };
}

export function getAiEnhanceDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Kolkata",
    year: "numeric"
  }).format(date);
}

async function createDefaultAiEnhanceSettings() {
  const rows = await prisma.$queryRaw<AiEnhanceSettingsRow[]>`
    INSERT INTO ai_enhance_settings (id, limit_per_user, updated_at)
    VALUES (${SETTINGS_ID}, ${DEFAULT_LIMIT_PER_USER}, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
    RETURNING limit_per_user, updated_at
  `;
  return rows[0];
}

function toAiEnhanceSettings(row: AiEnhanceSettingsRow): AiEnhanceSettings {
  return {
    limitPerUser: row.limit_per_user,
    updatedAt: row.updated_at
  };
}
