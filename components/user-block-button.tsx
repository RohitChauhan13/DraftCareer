"use client";

import { useState } from "react";
import { Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function UserBlockButton({
  className,
  disabled = false,
  iconOnly = false,
  initialBlocked,
  userId,
  userName
}: {
  className?: string;
  disabled?: boolean;
  iconOnly?: boolean;
  initialBlocked: boolean;
  userId: string;
  userName: string;
}) {
  const [isBlocked, setIsBlocked] = useState(initialBlocked);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function updateBlockState() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isBlocked: !isBlocked })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setIsBlocked(result.user.isBlocked);
      toast.success(result.user.isBlocked ? "User blocked" : "User unblocked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Button
        className={`${isBlocked ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" : ""} ${className ?? ""}`.trim() || undefined}
        disabled={disabled}
        size={iconOnly ? "icon" : "sm"}
        title={isBlocked ? "Unblock user" : "Block user"}
        variant={isBlocked ? "secondary" : "danger"}
        onClick={() => setConfirmOpen(true)}
      >
        {isBlocked ? <ShieldCheck size={15} /> : <Ban size={15} />}
        {iconOnly ? <span className="sr-only">{isBlocked ? "Unblock user" : "Block user"}</span> : isBlocked ? "Unblock" : "Block"}
      </Button>
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={isBlocked ? "Unblock" : "Block"}
        description={
          isBlocked
            ? `${userName} will be able to log in again.`
            : `${userName} will no longer be able to log in. Existing open sessions may continue until they refresh or navigate.`
        }
        loading={loading}
        open={confirmOpen}
        title={isBlocked ? "Unblock user?" : "Block user?"}
        variant={isBlocked ? "primary" : "danger"}
        onCancel={() => {
          if (!loading) setConfirmOpen(false);
        }}
        onConfirm={updateBlockState}
      />
    </>
  );
}
