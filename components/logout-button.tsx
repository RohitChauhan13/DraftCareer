"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FullScreenLoader } from "@/components/page-loader";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      setConfirmOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logout failed");
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      {loading && <FullScreenLoader label="Logging out" words={["session", "account", "security", "workspace", "done"]} />}
      <Button variant="secondary" loading={loading} loadingText="Logging out" onClick={() => setConfirmOpen(true)}>
        <LogOut size={16} /> Logout
      </Button>
      <ConfirmDialog
        cancelLabel="Stay"
        confirmLabel="Logout"
        description="You will return to the login page. Any unsaved resume changes should be saved first."
        loading={loading}
        open={confirmOpen}
        title="Logout?"
        variant="danger"
        onCancel={() => {
          if (!loading) setConfirmOpen(false);
        }}
        onConfirm={logout}
      />
    </>
  );
}
