"use client";

import { useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
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

      <form className="space-y-5" onSubmit={saveSettings}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {settings.map((setting) => {
            const template = resumeTemplates.find((item) => item.id === setting.templateId);
            return (
              <div className={`overflow-hidden rounded-lg border bg-surface shadow-sm transition ${setting.isVisible ? "border-border" : "border-dashed border-border opacity-70"}`} key={setting.templateId}>
                <div className="relative h-32 overflow-hidden border-b border-border bg-slate-100 dark:bg-slate-950">
                  <div className="absolute left-1/2 top-0 w-[816px] origin-top" style={{ transform: "translateX(-50%) scale(0.155)" }}>
                    <ResumePreview data={createTemplatePreviewData(setting.templateId)} zoom={1} compact appearance="light" />
                  </div>
                  <button
                    className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md border text-white shadow-sm transition ${setting.isVisible ? "border-primary bg-primary hover:bg-primary/90" : "border-slate-700 bg-slate-900/85 hover:bg-slate-800"}`}
                    title={setting.isVisible ? "Hide from gallery" : "Show in gallery"}
                    type="button"
                    onClick={() => updateSetting(setting.templateId, { isVisible: !setting.isVisible })}
                  >
                    {setting.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  {setting.tag && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-black text-slate-900 shadow-sm">
                      {templateTagOptions.find((option) => option.value === setting.tag)?.label ?? setting.tag}
                    </span>
                  )}
                </div>
                <div className="space-y-2.5 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black leading-tight">{template?.label ?? setting.templateId}</p>
                    <p className="text-xs font-medium text-muted-foreground">{setting.templateId}</p>
                  </div>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                    value={setting.tag ?? ""}
                    onChange={(event) => updateSetting(setting.templateId, { tag: event.target.value ? event.target.value as TemplateTag : null })}
                  >
                    <option value="">No tag</option>
                    {templateTagOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${setting.isVisible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {setting.isVisible ? "Visible in gallery" : "Hidden from gallery"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
      scoreType: "cgpa",
      startDate: "2022-01",
      endDate: "2025-01",
      description: ""
    }]
  };
}
