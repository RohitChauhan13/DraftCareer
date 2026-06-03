import { redirect } from "next/navigation";
import { ResumeBuilder } from "@/components/resume-builder";
import { TemplateGallery } from "@/components/template-gallery";
import { getUserAiEnhanceUsage } from "@/lib/ai-enhance";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { getTemplateTagSettings } from "@/lib/template-tags";
import { emptyResumeData } from "@/utils/resume";
import type { TemplateId, ThemeId } from "@/types/resume";

const templateIds: TemplateId[] = ["modern", "ats", "minimal", "developer", "classic", "executive", "timeline", "compact", "editorial", "accent", "split", "mono"];
const themeIds: ThemeId[] = ["purple", "charcoal", "taupe", "navy", "blue", "teal", "green", "orange", "red"];

export const metadata = {
  title: "Resume Builder",
  robots: {
    index: false,
    follow: false
  }
};

export default async function NewResumePage({ searchParams }: { searchParams: Promise<{ templateId?: string; themeId?: string; themeColor?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [donationSettings, templateTagSettings, aiEnhanceUsage] = await Promise.all([
    getDonationSettings(),
    getTemplateTagSettings(),
    getUserAiEnhanceUsage(user.id)
  ]);

  const params = await searchParams;
  const templateId = templateIds.includes(params.templateId as TemplateId) ? params.templateId as TemplateId : null;
  const themeId = themeIds.includes(params.themeId as ThemeId) ? params.themeId as ThemeId : "red";
  const themeColor = typeof params.themeColor === "string" && /^#[0-9a-f]{6}$/i.test(params.themeColor) ? params.themeColor : undefined;

  if (!templateId) {
    return <TemplateGallery templateTagSettings={templateTagSettings} userName={user.name} userEmail={user.email} userRole={user.role} showDonation={donationSettings.isPageVisible} />;
  }

  return (
    <ResumeBuilder
      initialData={{
        ...emptyResumeData,
        templateId,
        themeId,
        themeColor,
        personal: {
          ...emptyResumeData.personal,
          fullName: user.name,
          email: user.email
        }
      }}
      initialAiEnhanceUsage={aiEnhanceUsage}
      user={{ name: user.name, email: user.email, role: user.role }}
      showDonation={donationSettings.isPageVisible}
    />
  );
}
