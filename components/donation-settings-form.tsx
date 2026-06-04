"use client";

import { useState } from "react";
import { BadgeIndianRupee, Eye, EyeOff, QrCode, Save } from "lucide-react";
import { toast } from "sonner";
import type { DonationSettings } from "@/lib/donation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DonationSettingsForm({ initialSettings }: { initialSettings: DonationSettings }) {
  const [isPageVisible, setIsPageVisible] = useState(initialSettings.isPageVisible);
  const [isQrVisible, setIsQrVisible] = useState(initialSettings.isQrVisible);
  const [upiId, setUpiId] = useState(initialSettings.upiId);
  const [saving, setSaving] = useState(false);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/donation-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPageVisible, isQrVisible, upiId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success("Saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={saveSettings}>
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
        <label className="rounded-lg border border-border bg-muted/25 p-3" htmlFor="upi-id">
          <span className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
            <BadgeIndianRupee className="text-primary" size={14} /> UPI ID
          </span>
          <Input
            className="mt-2 h-9"
            id="upi-id"
            placeholder="example@ybl"
            value={upiId}
            onChange={(event) => setUpiId(event.target.value)}
          />
          <p className="mt-2 truncate text-xs font-medium text-muted-foreground" title={upiId || "No UPI ID set"}>
            {upiId ? `Public page will use ${upiId}` : "Add a UPI ID before showing donation page."}
          </p>
        </label>

        <SettingToggle
          checked={isPageVisible}
          description={isPageVisible ? "Donation page is live." : "Donation page is hidden."}
          icon={isPageVisible ? <Eye size={15} /> : <EyeOff size={15} />}
          label="Donation page"
          onChange={setIsPageVisible}
        />
        <SettingToggle
          checked={isQrVisible}
          description={isQrVisible ? "QR appears on the public page." : "Only UPI button and ID show."}
          icon={<QrCode size={15} />}
          label="QR code"
          onChange={setIsQrVisible}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <StatusPill active={isPageVisible}>{isPageVisible ? "Page visible" : "Page hidden"}</StatusPill>
          <StatusPill active={isQrVisible}>{isQrVisible ? "QR visible" : "QR hidden"}</StatusPill>
        </div>
        <Button className="sm:w-auto" loading={saving} loadingText="Saving" type="submit">
          <Save size={16} /> Save donation settings
        </Button>
      </div>
    </form>
  );
}

function SettingToggle({
  checked,
  description,
  icon,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  icon: React.ReactNode;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition ${checked ? "border-primary/30 bg-primary/10" : "border-border bg-muted/25 hover:bg-muted/40"}`}>
      <div className="min-w-0">
        <span className={`flex items-center gap-2 text-sm font-black ${checked ? "text-primary" : "text-foreground"}`}>
          {icon}
          {label}
        </span>
        <p className="mt-1 truncate text-xs text-muted-foreground" title={description}>{description}</p>
      </div>
      <input
        checked={checked}
        className="h-4 w-4 shrink-0 accent-primary"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function StatusPill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
      {children}
    </span>
  );
}
