import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MainNav } from "@/components/main-nav";
import { ResumeUnavailable } from "@/components/resume-unavailable";
import { ResumePreview } from "@/templates/resume-preview";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";
import { resumeDataFromSections } from "@/utils/resume";

export const dynamic = "force-dynamic";

type PublicResumeRow = {
  id: string;
  title: string;
  template_id: string;
  is_public: boolean;
};

type PublicSectionRow = {
  section_type: string;
  content_json: unknown;
};

type ShareMetadataRow = {
  title: string;
  is_public: boolean;
  updated_at: Date;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rows = await prisma.$queryRaw<ShareMetadataRow[]>`
    SELECT title, is_public, updated_at
    FROM resumes
    WHERE share_slug = ${slug}
    LIMIT 1
  `;
  const resume = rows[0];
  if (!resume || !resume.is_public) {
    return {
      title: "Resume unavailable",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return {
    title: `${resume.title} Resume`,
    description: `View ${resume.title}, a public resume created with DraftCareer.`,
    alternates: {
      canonical: `/share/${slug}`
    },
    openGraph: {
      title: `${resume.title} Resume`,
      description: "Public resume created with DraftCareer.",
      url: `/share/${slug}`,
      type: "profile"
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function PublicResumePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  const donationSettings = await getDonationSettings();
  const { slug } = await params;
  const resumes = await prisma.$queryRaw<PublicResumeRow[]>`
    SELECT id, title, template_id, is_public
    FROM resumes
    WHERE share_slug = ${slug}
    LIMIT 1
  `;
  const resume = resumes[0];
  if (!resume) notFound();
  if (!resume.is_public) return <ResumeUnavailable />;

  const sections = await prisma.$queryRaw<PublicSectionRow[]>`
    SELECT section_type, content_json
    FROM resume_sections
    WHERE resume_id = ${resume.id}
  `;
  const data = resumeDataFromSections({
    title: resume.title,
    templateId: resume.template_id,
    sections: sections.map((section) => ({
      sectionType: section.section_type,
      contentJson: section.content_json
    }))
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainNav user={user ? { name: user.name, email: user.email, role: user.role } : null} showDonation={donationSettings.isPageVisible} />
      <section className="overflow-auto px-3 py-6 sm:px-4 sm:py-8">
        <div className="mx-auto w-fit min-[390px]:hidden">
          <ResumePreview data={data} zoom={0.35} />
        </div>
        <div className="mx-auto hidden w-fit min-[390px]:block sm:hidden">
          <ResumePreview data={data} zoom={0.42} />
        </div>
        <div className="mx-auto hidden w-fit sm:block md:hidden">
          <ResumePreview data={data} zoom={0.72} />
        </div>
        <div className="mx-auto hidden w-fit md:block lg:hidden">
          <ResumePreview data={data} zoom={0.9} />
        </div>
        <div className="mx-auto hidden w-fit lg:block">
          <ResumePreview data={data} zoom={1} />
        </div>
      </section>
    </main>
  );
}
