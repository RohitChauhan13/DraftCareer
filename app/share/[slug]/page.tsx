import { notFound } from "next/navigation";
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
      <MainNav user={user ? { name: user.name, email: user.email } : null} showDonation={donationSettings.isPageVisible} />
      <section className="overflow-auto px-4 py-8">
        <div className="mx-auto w-fit">
          <ResumePreview data={data} zoom={1} appearance="light" />
        </div>
      </section>
    </main>
  );
}
