import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Template Config",
  robots: {
    index: false,
    follow: false
  }
};

export default async function LegacyTemplateTagsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "admin" ? "/stats/template-config" : "/dashboard");
}
