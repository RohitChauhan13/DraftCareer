import { notFound, redirect } from "next/navigation";
import { TemplateGallery } from "@/components/template-gallery";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumeDataFromSections } from "@/utils/resume";

export default async function ChangeTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
      userEmail={user.email}
      userName={user.name}
    />
  );
}
