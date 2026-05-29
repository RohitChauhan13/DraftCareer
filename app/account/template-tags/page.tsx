import { redirect } from "next/navigation";
import { Tags } from "lucide-react";
import { TemplateTagSettingsForm } from "@/components/template-tag-settings-form";
import { MainNav } from "@/components/main-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { getTemplateTagSettings } from "@/lib/template-tags";

export const dynamic = "force-dynamic";

export default async function TemplateTagsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/account");

  const [donationSettings, tagSettings] = await Promise.all([
    getDonationSettings(),
    getTemplateTagSettings()
  ]);

  return (
    <main className="min-h-screen bg-background">
      <MainNav user={{ name: user.name, email: user.email, role: user.role }} showDonation={donationSettings.isPageVisible} />

      <section className="mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
                <Tags size={21} />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Template Tag Config</h1>
                <p className="text-sm text-muted-foreground">Set template badges shown on the template selection page.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TemplateTagSettingsForm initialSettings={tagSettings} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
