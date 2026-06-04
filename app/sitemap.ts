import type { MetadataRoute } from "next";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://draft-career.vercel.app").replace(/\/$/, "");

export const dynamic = "force-dynamic";

type PublicResumeSitemapRow = {
  share_slug: string;
  updated_at: Date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [donationSettings, publicResumes] = await Promise.all([
    getDonationSettings(),
    prisma.$queryRaw<PublicResumeSitemapRow[]>`
      SELECT share_slug, updated_at
      FROM resumes
      WHERE is_public = true AND share_slug IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 500
    `
  ]);

  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/feedback`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4
    }
  ];

  if (donationSettings.isPageVisible) {
    routes.push({
      url: `${siteUrl}/donation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3
    });
  }

  routes.push(...publicResumes.map((resume) => ({
    url: `${siteUrl}/share/${resume.share_slug}`,
    lastModified: resume.updated_at,
    changeFrequency: "monthly" as const,
    priority: 0.2
  })));

  return routes;
}
