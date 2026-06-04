import { redirect } from "next/navigation";
import { FeedbackForm } from "@/components/feedback-form";
import { MainNav } from "@/components/main-nav";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";

export const metadata = {
  title: "Feedback",
  description: "Share feedback with DraftCareer to help improve the free AI resume builder, resume templates, ATS enhancement, and PDF export experience.",
  alternates: {
    canonical: "/feedback"
  },
  openGraph: {
    title: "Feedback | DraftCareer",
    description: "Tell DraftCareer what to improve across resume building, AI enhancement, templates, and PDF export.",
    url: "/feedback"
  },
  twitter: {
    card: "summary",
    title: "Feedback | DraftCareer",
    description: "Share feedback to help improve DraftCareer's AI resume builder."
  }
};

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?reason=feedback");
  if (user.role === "admin") redirect("/stats/feedback");

  const donationSettings = await getDonationSettings();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <FeedbackForm userName={user.name} />
      </section>
    </main>
  );
}
