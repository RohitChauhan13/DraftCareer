import { notFound, redirect } from "next/navigation";
import { ResumeBuilder } from "@/components/resume-builder";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";
import { getResumeShareInfo } from "@/lib/resume-share";
import { resumeDataFromSections } from "@/utils/resume";

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const donationSettings = await getDonationSettings();

  const { id } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id, userId: user.id },
    include: { sections: true }
  });
  if (!resume) notFound();
  const share = await getResumeShareInfo(resume.id);

  return <ResumeBuilder resumeId={resume.id} initialData={resumeDataFromSections(resume)} initialShare={share} user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />;
}
