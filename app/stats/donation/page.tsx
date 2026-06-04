import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeIndianRupee } from "lucide-react";
import { DonationSettingsForm } from "@/components/donation-settings-form";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Donation Config",
  robots: {
    index: false,
    follow: false
  }
};

export default async function StatsDonationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const donationSettings = await getDonationSettings();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-foreground" href="/stats">
          <ArrowLeft size={16} /> Back to stats
        </Link>
        <Card className="mt-5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-accent text-accent-foreground">
                <BadgeIndianRupee size={22} />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Donation Config</h1>
                <p className="text-sm text-muted-foreground">Control the public donation page, UPI ID, and QR visibility.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DonationSettingsForm initialSettings={donationSettings} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
