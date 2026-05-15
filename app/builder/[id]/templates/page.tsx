import { notFound, redirect } from "next/navigation";
import { TemplateGallery } from "@/components/template-gallery";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";
import { resumeDataFromSections } from "@/utils/resume";

export default async function ChangeTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const donationSettings = await getDonationSettings();

  const { id } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id, userId: user.id },
    include: { sections: true }
  });
  if (!resume) notFound();

  return (
    <TemplateGallery
      initialData={resumeDataFromSections(resume)}
      resumeId={resume.id}
      showDonation={donationSettings.isPageVisible}
      userEmail={user.email}
      userName={user.name}
    />
  );
}
