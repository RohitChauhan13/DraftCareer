import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";

export const metadata = {
  title: "Login",
  robots: {
    index: false,
    follow: false
  }
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const donationSettings = await getDonationSettings();
  const params = await searchParams;
  return <AuthForm loginReason={getLoginReasonMessage(params.reason)} mode="login" showDonation={donationSettings.isPageVisible} />;
}

function getLoginReasonMessage(reason?: string) {
  const messages: Record<string, string> = {
    dashboard: "Log in first to access your dashboard and saved resumes.",
    feedback: "Log in first to share feedback with us.",
    templates: "Log in first to view and choose resume templates."
  };
  return reason ? messages[reason] : undefined;
}
