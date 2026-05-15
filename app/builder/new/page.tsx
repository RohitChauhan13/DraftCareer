import { redirect } from "next/navigation";
import { ResumeBuilder } from "@/components/resume-builder";
import { TemplateGallery } from "@/components/template-gallery";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { emptyResumeData } from "@/utils/resume";
import type { TemplateId, ThemeId } from "@/types/resume";

const templateIds: TemplateId[] = ["modern", "ats", "minimal", "developer", "classic", "executive", "timeline", "compact", "editorial", "accent", "split", "mono"];
const themeIds: ThemeId[] = ["purple", "charcoal", "taupe", "navy", "blue", "teal", "green", "orange", "red"];

export default async function NewResumePage({ searchParams }: { searchParams: Promise<{ templateId?: string; themeId?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const donationSettings = await getDonationSettings();

  const params = await searchParams;
  const templateId = templateIds.includes(params.templateId as TemplateId) ? params.templateId as TemplateId : null;
  const themeId = themeIds.includes(params.themeId as ThemeId) ? params.themeId as ThemeId : "red";

  if (!templateId) {
    return <TemplateGallery userName={user.name} userEmail={user.email} userRole={user.role} showDonation={donationSettings.isPageVisible} />;
  }

  return (
    <ResumeBuilder
      initialData={{
        ...emptyResumeData,
        templateId,
        themeId,
        personal: {
          ...emptyResumeData.personal,
          fullName: user.name,
          email: user.email
        }
      }}
      user={{ name: user.name, email: user.email, role: user.role }}
      showDonation={donationSettings.isPageVisible}
    />
  );
}
