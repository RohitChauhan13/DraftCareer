import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminFeedbackInbox } from "@/components/admin-feedback-inbox";
import type { AdminFeedbackRow } from "@/components/admin-feedback-inbox";
import { MainNav } from "@/components/main-nav";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Feedback",
  robots: {
    index: false,
    follow: false
  }
};

type FeedbackRow = {
  id: string;
  rating: number;
  category: string;
  message: string;
  allowContact: boolean;
  createdAt: Date;
  userName: string;
  userEmail: string;
};

export default async function AdminFeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const donationSettings = await getDonationSettings();
  const rows = await prisma.$queryRaw<FeedbackRow[]>`
    SELECT
      f.id,
      f.rating,
      f.category,
      f.message,
      f.allow_contact AS "allowContact",
      f.created_at AS "createdAt",
      u.name AS "userName",
      u.email AS "userEmail"
    FROM feedback f
    INNER JOIN users u ON u.id = f.user_id
    ORDER BY f.created_at DESC
  `;
  const feedbackRows: AdminFeedbackRow[] = rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString()
  }));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-foreground" href="/stats">
              <ArrowLeft size={16} /> Back to stats
            </Link>
            <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">Feedback Inbox</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Read what users are feeling, requesting, and struggling with inside DraftCareer.
            </p>
          </div>
        </div>

        <AdminFeedbackInbox rows={feedbackRows} />
      </section>
    </main>
  );
}
