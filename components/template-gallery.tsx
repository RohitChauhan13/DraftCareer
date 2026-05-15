"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { ResumePreview } from "@/templates/resume-preview";
import { resumeTemplates, resumeThemes } from "@/templates/resume-options";
import type { ResumeData, TemplateId, ThemeId } from "@/types/resume";
import { emptyResumeData, sectionsFromResumeData } from "@/utils/resume";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";

const draftKey = "resume-builder-draft";

export function TemplateGallery({
  userName,
  userEmail,
  initialData,
  resumeId,
  showDonation = true
}: {
  userName: string;
  userEmail: string;
  initialData?: ResumeData;
  resumeId?: string;
  showDonation?: boolean;
}) {
  const router = useRouter();
  const [themeId, setThemeId] = useState<ThemeId>(initialData?.themeId ?? "red");
  const [draft, setDraft] = useState<ResumeData | null>(initialData ?? null);
  const [choosing, setChoosing] = useState<TemplateId | null>(null);

  useEffect(() => {
    if (initialData || resumeId) return;
    const stored = sessionStorage.getItem(draftKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as ResumeData;
      setDraft({ ...parsed, textColors: parsed.textColors ?? {} });
      setThemeId(parsed.themeId);
    } catch {
      sessionStorage.removeItem(draftKey);
    }
  }, [initialData, resumeId]);

  const sampleBase = useMemo<ResumeData>(() => ({
    ...(draft ?? emptyResumeData),
    textColors: draft?.textColors ?? {},
    title: "Sales Resume",
    themeId,
    personal: {
      ...emptyResumeData.personal,
      ...(draft?.personal ?? {}),
      fullName: draft?.personal.fullName || userName || "Diya Agarwal",
      email: draft?.personal.email || userEmail || "d.agarwal@example.in",
      phone: draft?.personal.phone || "+91 11 5555 3345",
      location: draft?.personal.location || "New Delhi, India 110034"
    },
    summary: draft?.summary || "Customer-focused retail professional with solid understanding of retail dynamics, marketing and customer service.",
    skills: draft?.skills.length ? draft.skills : ["Cash register operation", "POS system operation", "Sales expertise", "Inventory management", "Accurate money handling", "Retail merchandising"],
    experience: draft?.experience.length ? draft.experience : [
      {
        company: "ZARA - New Delhi, India",
        role: "Retail Sales Associate",
        startDate: "2017-02",
        endDate: "",
        current: true,
        description: "Increased monthly sales 10% by effectively upselling and cross-selling products. Prevented store losses by leveraging awareness, attention to detail, and integrity."
      },
      {
        company: "Dunkin' Donuts - New Delhi, India",
        role: "Barista",
        startDate: "2015-03",
        endDate: "2017-01",
        current: false,
        description: "Upsold seasonal drinks and pastries, boosting average store sales by Rs1500 weekly. Managed morning rush of over 300 customers daily."
      }
    ],
    education: draft?.education.length ? draft.education : [
      {
        college: "Oxford Software Institute & Oxford School of English",
        degree: "Diploma in Financial Accounting",
        cgpa: "",
        startDate: "",
        endDate: "2016-01"
      }
    ]
  }), [draft, themeId, userEmail, userName]);

  async function chooseTemplate(templateId: TemplateId) {
    const nextData = { ...(draft ?? sampleBase), templateId, themeId };
    setChoosing(templateId);

    if (!resumeId) {
      sessionStorage.setItem(draftKey, JSON.stringify(nextData));
      router.push(`/builder/new?templateId=${templateId}&themeId=${themeId}`);
      return;
    }

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: nextData.title,
          templateId,
          sections: sectionsFromResumeData(nextData)
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success("Updated");
      router.push(`/builder/${resumeId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
      setChoosing(null);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <MainNav user={{ name: userName, email: userEmail }} showDonation={showDonation} />
      <header className="sticky top-[65px] z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface" href={resumeId ? `/builder/${resumeId}` : "/dashboard"} title="Back">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Choose your resume template</h1>
              <p className="text-sm text-muted-foreground">Pick a color theme first, then choose the layout you want.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3">
              <span className="mr-1 font-semibold">Colors</span>
              {resumeThemes.map((themeOption) => (
                <button
                  aria-label={themeOption.label}
                  className="grid h-8 w-8 place-items-center rounded-full border border-border shadow-sm"
                  key={themeOption.id}
                  style={{ backgroundColor: themeOption.color }}
                  title={themeOption.label}
                  onClick={() => setThemeId(themeOption.id)}
                >
                  {themeId === themeOption.id && (
                    <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-blue-600">
                      <Check size={15} color={themeOption.text} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-background via-background to-muted px-4 py-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 xl:grid-cols-3">
          {resumeTemplates.map((template) => (
            <TemplateCard
              choosing={choosing === template.id}
              data={{ ...sampleBase, templateId: template.id, themeId }}
              key={template.id}
              templateId={template.id}
              onChoose={chooseTemplate}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function TemplateCard({ data, templateId, choosing, onChoose }: { data: ResumeData; templateId: TemplateId; choosing: boolean; onChoose: (templateId: TemplateId) => void }) {
  const template = resumeTemplates.find((item) => item.id === templateId);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
      {template?.popular && (
        <div className="absolute right-5 top-5 z-10 rounded-md bg-sky-100 px-10 py-2 text-sm font-bold text-sky-950 shadow">
          Popular
        </div>
      )}
      <div className="relative h-[560px] overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute left-1/2 top-0 w-[816px] origin-top" style={{ transform: "translateX(-50%) scale(0.48)" }}>
          <ResumePreview data={data} zoom={1} compact />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-surface via-surface/95 to-transparent px-6 pb-5 pt-16">
        <button
          className="inline-flex h-14 min-w-72 items-center justify-center rounded-full bg-blue-600 px-8 text-lg font-bold text-white shadow-lg transition group-hover:bg-blue-700"
          disabled={choosing}
          onClick={() => onChoose(templateId)}
        >
          {choosing ? "Applying..." : "Choose template"}
        </button>
      </div>
    </div>
  );
}
