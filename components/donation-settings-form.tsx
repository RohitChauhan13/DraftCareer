"use client";

import { useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
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
    <form className="space-y-5" onSubmit={saveSettings}>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="upi-id">UPI ID</label>
        <Input id="upi-id" value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="example@ybl" />
      </div>

      <SettingToggle
        checked={isPageVisible}
        description={isPageVisible ? "The /donation page is visible." : "The /donation page returns not found."}
        label="Show donation page"
        onChange={setIsPageVisible}
      />
      <SettingToggle
        checked={isQrVisible}
        description={isQrVisible ? "The QR code is visible on the page." : "Only the UPI button and ID are shown."}
        label="Show QR code"
        onChange={setIsQrVisible}
      />

      <Button loading={saving} loadingText="Saving" type="submit">
        <Save size={16} /> Save donation settings
      </Button>
    </form>
  );
}

function SettingToggle({
  checked,
  description,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border bg-muted/35 p-4">
      <div>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {checked ? <Eye className="text-primary" size={16} /> : <EyeOff className="text-muted-foreground" size={16} />}
          {label}
        </span>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <input
        checked={checked}
        className="h-5 w-5 accent-primary"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
