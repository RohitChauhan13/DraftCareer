import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";

export const metadata = {
  title: "Sign Up",
  robots: {
    index: false,
    follow: false
  }
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const donationSettings = await getDonationSettings();
  return <AuthForm mode="signup" showDonation={donationSettings.isPageVisible} />;
}
