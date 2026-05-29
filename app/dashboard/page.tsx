import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { DashboardActions } from "@/components/dashboard-actions";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NavActionLink } from "@/components/nav-action-link";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const donationSettings = await getDonationSettings();

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: { sections: true },
    orderBy: [
      { isPinned: "desc" },
      { updatedAt: "desc" }
    ]
  });

  return (
    <main className="min-h-screen">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Welcome back, {user.name}</p>
            <h2 className="mt-1 text-xl font-semibold">Saved resumes</h2>
            <p className="text-sm text-muted-foreground">Create, edit, duplicate, and export resumes.</p>
          </div>
          <NavActionLink href="/builder/new" icon>Create Resume</NavActionLink>
        </div>

        {resumes.length === 0 ? (
          <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-border bg-surface p-8 text-center">
            <div>
              <FileText className="mx-auto mb-4 text-primary" size={42} />
              <h3 className="text-lg font-semibold">No resumes yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start with a clean professional template.</p>
              <NavActionLink className="mt-5" href="/builder/new" icon>Create Resume</NavActionLink>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resumes.map((resume) => (
              <Card key={resume.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{resume.title}</h3>
                      <p className="text-sm text-muted-foreground">Template: {resume.templateId}</p>
                    </div>
                    <DashboardActions resume={resume} />
                  </div>
                </CardHeader>
                <CardContent>
                  <NavActionLink href={`/builder/${resume.id}`}>Edit resume</NavActionLink>
                  <p className="mt-4 text-xs text-muted-foreground">Updated {resume.updatedAt.toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
