import { redirect } from "next/navigation";
import { Activity, CalendarDays, Eye, FileText, Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "States",
  robots: {
    index: false,
    follow: false
  }
};

type UserStatsRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  last_seen_at: Date | null;
  created_at: Date;
  updated_at: Date;
  resume_count: bigint;
  public_resume_count: bigint;
  private_resume_count: bigint;
  latest_resume_update: Date | null;
};

export default async function StatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const donationSettings = await getDonationSettings();
  const rows = await prisma.$queryRaw<UserStatsRow[]>`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.email_verified,
      u.last_seen_at,
      u.created_at,
      u.updated_at,
      COUNT(r.id) AS resume_count,
      COUNT(r.id) FILTER (WHERE r.is_public = true) AS public_resume_count,
      COUNT(r.id) FILTER (WHERE r.is_public = false) AS private_resume_count,
      MAX(r.updated_at) AS latest_resume_update
    FROM users u
    LEFT JOIN resumes r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY COALESCE(u.last_seen_at, GREATEST(u.updated_at, COALESCE(MAX(r.updated_at), u.updated_at))) DESC
  `;

  const totalUsers = rows.length;
  const verifiedUsers = rows.filter((row) => row.email_verified).length;
  const totalResumes = rows.reduce((sum, row) => sum + Number(row.resume_count), 0);
  const publicResumes = rows.reduce((sum, row) => sum + Number(row.public_resume_count), 0);
  const activeUsers = rows.filter((row) => Number(row.resume_count) > 0).length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-normal text-primary">Admin only</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal sm:text-4xl">States</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            User and resume activity overview for DraftCareer.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard icon={UsersRound} label="Users" value={totalUsers.toString()} />
          <MetricCard icon={ShieldCheck} label="Verified" value={verifiedUsers.toString()} />
          <MetricCard icon={FileText} label="Resumes" value={totalResumes.toString()} />
          <MetricCard icon={Eye} label="Public" value={publicResumes.toString()} />
          <MetricCard icon={Activity} label="Active users" value={activeUsers.toString()} />
        </div>

        <Card className="mt-6 overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Users</h2>
              <p className="text-sm text-muted-foreground">Last app use is shown in India time and updates while signed-in users browse the app.</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="border-y border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold">User</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Created</th>
                    <th className="px-4 py-3 font-bold">Last app use</th>
                    <th className="px-4 py-3 font-bold">Resumes</th>
                    <th className="px-4 py-3 font-bold">Public</th>
                    <th className="px-4 py-3 font-bold">Private</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => {
                    const resumeCount = Number(row.resume_count);
                    const inferredActivity = latestDate(row.updated_at, row.latest_resume_update);
                    const lastActivity = row.last_seen_at ?? inferredActivity;
                    return (
                      <tr className="bg-surface transition hover:bg-muted/35" key={row.id}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                              {initials(row.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{row.name}</p>
                              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Mail size={12} /> {row.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge>{row.role}</Badge>
                            <Badge tone={row.email_verified ? "success" : "muted"}>{row.email_verified ? "Verified" : "Unverified"}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{formatDate(row.created_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays size={14} />
                            {formatDate(lastActivity)}
                          </div>
                          {!row.last_seen_at && (
                            <p className="mt-1 text-xs text-muted-foreground">Inferred from edits</p>
                          )}
                        </td>
                        <td className="px-4 py-4 font-bold">{resumeCount}</td>
                        <td className="px-4 py-4">{Number(row.public_resume_count)}</td>
                        <td className="px-4 py-4">{Number(row.private_resume_count)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="text-primary" size={20} />
        <p className="mt-3 text-xs font-bold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-black">{value}</p>
      </CardContent>
    </Card>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "muted" }) {
  const classes = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    muted: "bg-muted text-muted-foreground"
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${classes[tone]}`}>{children}</span>;
}

function latestDate(first: Date, second: Date | null) {
  if (!second) return first;
  return first > second ? first : second;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(date);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return letters.toUpperCase();
}
