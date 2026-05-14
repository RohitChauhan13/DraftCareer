import { notFound, redirect } from "next/navigation";
import { ResumeBuilder } from "@/components/resume-builder";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resumeDataFromSections } from "@/utils/resume";

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const resume = await prisma.resume.findFirst({
    where: { id, userId: user.id },
    include: { sections: true }
  });
  if (!resume) notFound();

  return <ResumeBuilder resumeId={resume.id} initialData={resumeDataFromSections(resume)} />;
}
