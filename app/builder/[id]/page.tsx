import { notFound, redirect } from "next/navigation";
import { ResumeBuilder } from "@/components/resume-builder";
import { getUserAiEnhanceUsage } from "@/lib/ai-enhance";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";
import { getResumeShareInfo } from "@/lib/resume-share";
import { resumeDataFromSections } from "@/utils/resume";

export const metadata = {
  title: "Edit Resume",
  robots: {
    index: false,
    follow: false
  }
};

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [donationSettings, aiEnhanceUsage] = await Promise.all([
    getDonationSettings(),
    getUserAiEnhanceUsage(user.id)
  ]);

  const { id } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id, userId: user.id },
    include: { sections: true }
  });
  if (!resume) notFound();
  const share = await getResumeShareInfo(resume.id);

  return <ResumeBuilder resumeId={resume.id} initialData={resumeDataFromSections(resume)} initialAiEnhanceUsage={aiEnhanceUsage} initialShare={share} user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />;
}
