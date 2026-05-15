import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const donationSettings = await getDonationSettings();
  return <AuthForm mode="login" showDonation={donationSettings.isPageVisible} />;
}
