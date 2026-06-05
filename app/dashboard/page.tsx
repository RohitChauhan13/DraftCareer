import { redirect } from "next/navigation";
import { CalendarClock, FileText, LayoutTemplate, Pin, Plus, Sparkles } from "lucide-react";
import { DashboardActions } from "@/components/dashboard-actions";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NavActionLink } from "@/components/nav-action-link";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?reason=dashboard");

  const [donationSettings, resumes] = await Promise.all([
    getDonationSettings(),
    prisma.resume.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        templateId: true,
        isPinned: true,
        isPublic: true,
        viewCount: true,
        updatedAt: true
      },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" }
      ]
    })
  ]);
  const dashboardResumes = resumes.map((resume) => ({
    ...resume,
    isPinned: Boolean(resume.isPinned)
  }));
  const pinnedCount = dashboardResumes.filter((resume) => resume.isPinned).length;
  const latestResume = dashboardResumes[0];

  return (
    <main className="min-h-screen bg-background">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              <Sparkles size={15} /> Welcome back, {user.name}
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight">Saved resumes</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create, edit, duplicate, pin, and export your resumes.</p>
          </div>
          <NavActionLink className="h-12 px-5" href="/builder/new">
            <Plus size={18} /> Create Resume
          </NavActionLink>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <DashboardStat icon={FileText} label="Total resumes" value={String(dashboardResumes.length)} />
          <DashboardStat icon={Pin} label="Pinned" value={String(pinnedCount)} />
          <DashboardStat icon={CalendarClock} label="Latest update" value={latestResume ? formatDate(latestResume.updatedAt) : "No activity"} />
        </div>

        {dashboardResumes.length === 0 ? (
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
            {dashboardResumes.map((resume) => (
              <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]" key={resume.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold">{resume.title}</h3>
                        {resume.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                            <Pin size={12} fill="currentColor" /> Pinned
                          </span>
                        )}
                      </div>
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                        <LayoutTemplate size={13} /> {resume.templateId}
                      </p>
                    </div>
                    <DashboardActions resume={resume} />
                  </div>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-3">
                  <div>
                    <NavActionLink href={`/builder/${resume.id}`}>Edit resume</NavActionLink>
                    <p className="mt-4 text-xs text-muted-foreground">Last Updated: {formatDate(resume.updatedAt)}</p>
                    {resume.isPublic && (
                      <p className="mt-1 text-xs text-muted-foreground">Views: {resume.viewCount}</p>
                    )}
                  </div>
                  <div className="hidden h-14 w-14 place-items-center rounded-md bg-primary/10 text-primary sm:grid">
                    <FileText size={24} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function DashboardStat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-muted text-primary">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(value);
}
