"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { ResumeData, TemplateId, TemplateTag } from "@/types/resume";
import type { TemplateTagSetting } from "@/lib/template-tags";
import { templateTagOptions } from "@/lib/template-tags";
import { resumeTemplates } from "@/templates/resume-options";
import { ResumePreview } from "@/templates/resume-preview";
import { emptyResumeData } from "@/utils/resume";
import { Button } from "@/components/ui/button";
import { WordLoader } from "@/components/page-loader";

export function TemplateTagSettingsForm({ initialSettings }: { initialSettings: TemplateTagSetting[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  function updateSetting(templateId: TemplateTagSetting["templateId"], patch: Partial<TemplateTagSetting>) {
    setSettings((current) => current.map((setting) => (
      setting.templateId === templateId ? { ...setting, ...patch } : setting
    )));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/template-tags", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSettings(result.settings);
      toast.success("Saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {saving && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <WordLoader label="Saving" words={["tags", "templates", "badges", "config", "preview"]} />
        </div>
      )}

      <form className="space-y-4" onSubmit={saveSettings}>
        {settings.map((setting) => {
          const template = resumeTemplates.find((item) => item.id === setting.templateId);
          return (
            <div className="grid gap-4 rounded-md border border-border bg-muted/35 p-4 sm:grid-cols-[1fr_220px] sm:items-center" key={setting.templateId}>
              <div className="grid grid-cols-[76px_1fr] items-center gap-4">
                <div className="relative h-24 w-[74px] overflow-hidden rounded border border-border bg-slate-950">
                  <div className="absolute left-1/2 top-0 w-[816px] origin-top" style={{ transform: "translateX(-50%) scale(0.092)" }}>
                    <ResumePreview data={createTemplatePreviewData(setting.templateId)} zoom={1} compact appearance="light" />
                  </div>
                </div>
                <span>
                  <span className="block text-sm font-semibold">{template?.label ?? setting.templateId}</span>
                  <span className="text-xs text-muted-foreground">{setting.templateId}</span>
                </span>
              </div>
              <select
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                value={setting.tag ?? ""}
                onChange={(event) => updateSetting(setting.templateId, { tag: event.target.value ? event.target.value as TemplateTag : null })}
              >
                <option value="">No tag</option>
                {templateTagOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  checked={setting.isVisible}
                  className="h-4 w-4 accent-primary"
                  type="checkbox"
                  onChange={(event) => updateSetting(setting.templateId, { isVisible: event.target.checked })}
                />
                Show in gallery
              </label>
            </div>
          );
        })}

        <Button disabled={saving} type="submit">
          <Save size={16} /> Save template settings
        </Button>
      </form>
    </>
  );
}

function createTemplatePreviewData(templateId: TemplateId): ResumeData {
  return {
    ...emptyResumeData,
    templateId,
    themeId: "red",
    title: "Preview",
    personal: {
      ...emptyResumeData.personal,
      fullName: "Rohit Chauhan",
      email: "rohitchauhan6232@gmail.com",
      phone: "+91 7024756186",
      location: "Sangli, India"
    },
    summary: "Product-minded engineer building fast, accessible interfaces.",
    skills: ["React", "Next.js", "TypeScript", "UI Engineering"],
    experience: [{
      company: "DraftCareer",
      role: "Software Engineer",
      startDate: "2024-01",
      endDate: "",
      current: true,
      description: "Built polished resume workflows and export-ready templates."
    }],
    education: [{
      college: "Bharati Vidyapeeth",
      degree: "BCA",
      cgpa: "",
      startDate: "2022-01",
      endDate: "2025-01",
      description: ""
    }]
  };
}
