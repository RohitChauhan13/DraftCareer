import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Account",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "admin" ? "/stats/donation" : "/dashboard");
}
