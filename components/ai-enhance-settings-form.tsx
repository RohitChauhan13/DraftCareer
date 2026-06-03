"use client";

import { useState } from "react";
import { Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AiEnhanceSettingsForm({ initialLimit }: { initialLimit: number }) {
  const [limit, setLimit] = useState(String(initialLimit));
  const [saving, setSaving] = useState(false);

  async function saveSettings() {
    const limitPerUser = Number(limit);
    if (!Number.isInteger(limitPerUser) || limitPerUser < 0) {
      toast.error("Enter a valid whole number.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/ai-enhance-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limitPerUser })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setLimit(String(result.settings.limitPerUser));
      toast.success("AI enhance limit saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold">AI enhancement limit</h2>
            <p className="text-sm text-muted-foreground">Normal users can enhance this many times per day.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="w-full max-w-xs space-y-1">
            <span className="text-xs font-bold uppercase text-muted-foreground">Daily enhances per user</span>
            <Input min={0} step={1} type="number" value={limit} onChange={(event) => setLimit(event.target.value)} />
          </label>
          <Button loading={saving} loadingText="Saving" type="button" onClick={saveSettings}>
            <Save size={16} /> Save limit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
