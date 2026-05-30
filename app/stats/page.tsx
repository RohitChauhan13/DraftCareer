import { redirect } from "next/navigation";
import { Activity, Eye, FileText, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent } from "@/components/ui/card";
import { StatsUsersTable } from "@/components/stats-users-table";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Stats",
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
  is_blocked: boolean;
  last_seen_at: Date | null;
  created_at: Date;
  updated_at: Date;
  resume_count: bigint;
  public_resume_count: bigint;
  private_resume_count: bigint;
  latest_resume_update: Date | null;
};

export default async function StatsPage() {
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
      u.is_blocked,
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

  const userRows = rows.filter((row) => row.role !== "admin");
  const activeCutoff = Date.now() - 5 * 60 * 1000;
  const totalUsers = userRows.length;
  const verifiedUsers = userRows.filter((row) => row.email_verified).length;
  const totalResumes = userRows.reduce((sum, row) => sum + Number(row.resume_count), 0);
  const publicResumes = userRows.reduce((sum, row) => sum + Number(row.public_resume_count), 0);
  const activeUsers = userRows.filter((row) => row.last_seen_at && row.last_seen_at.getTime() >= activeCutoff).length;
  const tableRows = userRows.map((row) => {
    const inferredActivity = latestDate(row.updated_at, row.latest_resume_update);
    const lastActivity = row.last_seen_at ?? inferredActivity;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.email_verified,
      isBlocked: row.is_blocked,
      createdAt: row.created_at.toISOString(),
      lastSeenAt: row.last_seen_at?.toISOString() ?? null,
      lastAppUseAt: lastActivity.toISOString(),
      resumeCount: Number(row.resume_count),
      publicResumeCount: Number(row.public_resume_count),
      privateResumeCount: Number(row.private_resume_count)
    };
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="mt-2 text-3xl font-black tracking-normal sm:text-4xl">Stats</h1>
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

        <StatsUsersTable currentUserId={user.id} rows={tableRows} />
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

function latestDate(first: Date, second: Date | null) {
  if (!second) return first;
  return first > second ? first : second;
}
