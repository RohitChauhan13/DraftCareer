import { redirect } from "next/navigation";
import { BadgeIndianRupee, CalendarDays, Mail, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { DonationSettingsForm } from "@/components/donation-settings-form";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "admin";
  const publicDonationSettings = await getDonationSettings();
  const donationSettings = isAdmin ? publicDonationSettings : null;

  return (
    <main className="min-h-screen bg-background">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={publicDonationSettings.isPageVisible} />

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
                <UserRound size={21} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{isAdmin ? "Admin account" : "Account details"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile icon={Mail} label="Email" value={user.email} />
              {isAdmin && <InfoTile icon={ShieldCheck} label="Role" value={user.role} />}
              <InfoTile icon={CalendarDays} label="Joined" value={user.createdAt.toLocaleDateString()} />
            </div>
          </CardContent>
        </Card>

        {donationSettings && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-accent text-accent-foreground">
                  <BadgeIndianRupee size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Donation Settings</h2>
                  <p className="text-sm text-muted-foreground">Controls the public /donation page.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DonationSettingsForm initialSettings={donationSettings} />
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/35 p-4">
      <Icon className="text-primary" size={18} />
      <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}
