import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { DashboardActions } from "@/components/dashboard-actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";
import { NavActionLink } from "@/components/nav-action-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    include: { sections: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">HireSheet</p>
            <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NavActionLink href="/account">My Account</NavActionLink>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Saved resumes</h2>
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
