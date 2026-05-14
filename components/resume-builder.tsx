"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Download, GripVertical, LayoutTemplate, Minus, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { ResumePreview } from "@/templates/resume-preview";
import type { ResumeData } from "@/types/resume";
import { resumeThemes } from "@/templates/resume-options";
import { sectionsFromResumeData } from "@/utils/resume";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Textarea } from "@/components/ui/input";
import { WordLoader } from "@/components/page-loader";

const skillSuggestions = ["React", "JavaScript", "React-Native", "Next.js", "TypeScript", "Node.js", "Basic HTML", "Angular", "PostgreSQL", "MySQL", "MongoDB", "Prisma", "Docker", "AWS", "Git"];
const requiredPersonalFields = ["fullName", "email", "phone", "location"] as const;
const draftKey = "resume-builder-draft";

export function ResumeBuilder({ initialData, resumeId }: { initialData: ResumeData; resumeId?: string }) {
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ResumeData>(initialData);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const [zoom, setZoom] = useState(0.78);
  const [draggingSkill, setDraggingSkill] = useState<string | null>(null);

  useEffect(() => {
    if (resumeId) return;
    const stored = sessionStorage.getItem(draftKey);
    if (!stored) return;
    try {
      const draft = JSON.parse(stored) as ResumeData;
      setData({ ...draft, templateId: initialData.templateId, themeId: initialData.themeId });
      sessionStorage.removeItem(draftKey);
    } catch {
      sessionStorage.removeItem(draftKey);
    }
  }, [initialData.templateId, initialData.themeId, resumeId]);
  const progress = useMemo(() => {
    const checks = [
      data.personal.fullName,
      data.personal.email,
      data.summary,
      data.skills.length,
      data.education.length,
      data.experience.length,
      data.projects.length
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [data]);

  function getMissingPersonalFields() {
    return requiredPersonalFields.filter((key) => !data.personal[key].trim());
  }

  function validatePersonalDetails() {
    const missing = getMissingPersonalFields();
    if (missing.length === 0) return true;

    toast.warning(`Please complete personal details: ${missing.map(formatPersonalField).join(", ")}.`);
    return false;
  }

  async function save() {
    if (!validatePersonalDetails()) return;
    setSaving(true);
    try {
      const result = await persistResume();
      toast.success("Resume saved");
      if (!resumeId) router.replace(`/builder/${result.resume.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save resume");
    } finally {
      setSaving(false);
    }
  }

  async function changeTemplate() {
    if (!resumeId) {
      sessionStorage.setItem(draftKey, JSON.stringify(data));
      router.push("/builder/new");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          templateId: data.templateId,
          sections: sectionsFromResumeData(data)
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push(`/builder/${resumeId}/templates`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to prepare template change");
    } finally {
      setSaving(false);
    }
  }

  function requestPdfDownload() {
    if (!resumeId || exporting) return;
    if (!validatePersonalDetails()) return;
    setConfirmDownload(true);
  }

  async function downloadPdf() {
    if (!resumeId || exporting) return;
    setExporting(true);
    try {
      await persistResume();
      if (!pdfRef.current) throw new Error("Unable to prepare PDF preview");
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          filename: `${data.title.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "resume"}.pdf`,
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          image: { type: "jpeg", quality: 0.98 },
          jsPDF: { unit: "px", format: [816, 1056], orientation: "portrait" },
          margin: 0,
          pagebreak: { mode: ["css", "legacy"], avoid: [".resume-section", ".resume-entry"] }
        })
        .from(pdfRef.current)
        .save();
      toast.success("PDF downloaded");
      setConfirmDownload(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download PDF");
    } finally {
      setExporting(false);
    }
  }

  function addSkill(skill: string) {
    const clean = skill.trim();
    if (!clean || data.skills.includes(clean)) return;
    setData({ ...data, skills: [...data.skills, clean] });
  }

  async function persistResume() {
    const response = await fetch(resumeId ? `/api/resumes/${resumeId}` : "/api/resumes", {
      method: resumeId ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        templateId: data.templateId,
        sections: sectionsFromResumeData(data)
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  }

  function reorderSkill(targetSkill: string) {
    if (!draggingSkill || draggingSkill === targetSkill) return;

    const next = [...data.skills];
    const from = next.indexOf(draggingSkill);
    const to = next.indexOf(targetSkill);
    if (from === -1 || to === -1) return;

    next.splice(from, 1);
    next.splice(to, 0, draggingSkill);
    setData({ ...data, skills: next });
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link className="grid h-10 w-10 place-items-center rounded-md border border-border bg-white" href="/dashboard" title="Back">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <Input className="h-9 w-64 font-semibold" value={data.title} onChange={(event) => setData({ ...data, title: event.target.value })} />
              <div className="mt-2 h-1.5 w-64 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="icon" variant="secondary" onClick={() => setZoom((value) => Math.max(0.55, value - 0.08))} title="Zoom out"><Minus size={16} /></Button>
            <Button size="icon" variant="secondary" onClick={() => setZoom((value) => Math.min(1, value + 0.08))} title="Zoom in"><Plus size={16} /></Button>
            <Button variant="secondary" onClick={save} loading={saving} loadingText="Saving"><Save size={16} /> Save</Button>
            {resumeId && (
              <Button onClick={requestPdfDownload} loading={exporting} loadingText="Preparing PDF">
                <Download size={16} /> PDF
              </Button>
            )}
          </div>
        </div>
      </header>

      {(saving || exporting) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <WordLoader
            label={saving ? "Saving" : "Preparing"}
            words={saving ? ["resume", "sections", "preview", "changes", "data"] : ["PDF", "layout", "pages", "download", "resume"]}
          />
        </div>
      )}

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Save & Download"
        description="Your latest edits and selected theme will be saved before generating the PDF."
        loading={exporting}
        open={confirmDownload}
        title="Save before downloading?"
        onCancel={() => {
          if (!exporting) setConfirmDownload(false);
        }}
        onConfirm={downloadPdf}
      />

      <div className="pointer-events-none fixed -left-[10000px] top-0 opacity-0" aria-hidden="true">
        <div ref={pdfRef}>
          <ResumePreview data={data} zoom={1} compact />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[420px_1fr]">
        <motion.aside initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <Panel title="Template">
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Theme</p>
              <div className="flex flex-wrap gap-2 rounded-md bg-muted p-2">
                {resumeThemes.map((theme) => (
                  <button
                    aria-label={theme.label}
                    className="grid h-8 w-8 place-items-center rounded-full border border-border shadow-sm"
                    key={theme.id}
                    style={{ backgroundColor: theme.color }}
                    title={theme.label}
                    onClick={() => setData({ ...data, themeId: theme.id })}
                  >
                    {data.themeId === theme.id && (
                      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-blue-600">
                        <Check size={15} color={theme.text} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" variant="secondary" onClick={changeTemplate} loading={saving} loadingText="Saving draft">
              <LayoutTemplate size={16} /> Change template
            </Button>
          </Panel>

          <Panel title="Personal Information">
            {getMissingPersonalFields().length > 0 && (
              <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Full name, email, phone, and location are required before saving or downloading.
              </p>
            )}
            <Grid>
              {(["fullName", "email", "phone", "location", "linkedin", "github", "portfolio"] as const).map((key) => (
                <Input
                  className={requiredPersonalFields.includes(key as typeof requiredPersonalFields[number]) && !data.personal[key].trim() ? "border-amber-300 bg-amber-50/60" : undefined}
                  key={key}
                  placeholder={key.replace(/([A-Z])/g, " $1")}
                  value={data.personal[key]}
                  onChange={(event) => setData({ ...data, personal: { ...data.personal, [key]: event.target.value } })}
                />
              ))}
            </Grid>
          </Panel>

          <Panel title={`Professional Summary (${data.summary.length}/600)`}>
            <Textarea maxLength={600} value={data.summary} onChange={(event) => setData({ ...data, summary: event.target.value })} placeholder="Impact-focused summary for the target role." />
            <div className="mt-2 flex flex-wrap gap-2">
              {["Frontend engineer with product instincts", "Backend engineer focused on reliable systems", "Full-stack developer shipping polished user experiences"].map((suggestion) => (
                <button className="rounded border border-border bg-white px-2 py-1 text-xs" key={suggestion} onClick={() => setData({ ...data, summary: suggestion })}>{suggestion}</button>
              ))}
            </div>
          </Panel>

          <Panel title="Skills">
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.namedItem("skill") as HTMLInputElement; addSkill(input.value); input.value = ""; }}>
              <Input name="skill" placeholder="Add a skill" />
              <Button type="submit" size="icon"><Plus size={16} /></Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {skillSuggestions.map((skill) => <button className="rounded border border-border px-2 py-1 text-xs" key={skill} onClick={() => addSkill(skill)}>{skill}</button>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <div
                  className={`inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-white transition ${draggingSkill === skill ? "opacity-50" : ""}`}
                  draggable
                  key={skill}
                  onDragEnd={() => setDraggingSkill(null)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    reorderSkill(skill);
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingSkill(skill);
                  }}
                >
                  <GripVertical size={13} className="cursor-grab" />
                  <span>{skill}</span>
                  <button
                    className="ml-1 grid h-4 w-4 place-items-center rounded hover:bg-white/20"
                    type="button"
                    title={`Remove ${skill}`}
                    onClick={() => setData({ ...data, skills: data.skills.filter((item) => item !== skill) })}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Collection title="Experience" items={data.experience} addLabel="Add experience" onAdd={() => setData({ ...data, experience: [...data.experience, { company: "", role: "", startDate: "", endDate: "", current: false, description: "" }] })}>
            {data.experience.map((item, index) => (
              <Grid key={index}>
                <Input placeholder="Company" value={item.company} onChange={(e) => updateArray("experience", index, { company: e.target.value })} />
                <Input placeholder="Role" value={item.role} onChange={(e) => updateArray("experience", index, { role: e.target.value })} />
                <DateField label="Start month" value={item.startDate} onChange={(value) => updateArray("experience", index, { startDate: value })} />
                <DateField label="End month" value={item.endDate} disabled={item.current} onChange={(value) => updateArray("experience", index, { endDate: value })} />
                <label className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm">
                  <input
                    checked={item.current}
                    className="h-4 w-4 accent-primary"
                    type="checkbox"
                    onChange={(e) => updateArray("experience", index, { current: e.target.checked, endDate: e.target.checked ? "" : item.endDate })}
                  />
                  Currently working here
                </label>
                <Textarea placeholder="Description" value={item.description} onChange={(e) => updateArray("experience", index, { description: e.target.value })} />
              </Grid>
            ))}
          </Collection>

          <Collection title="Projects" items={data.projects} addLabel="Add project" onAdd={() => setData({ ...data, projects: [...data.projects, { name: "", description: "", technologies: "", github: "", live: "" }] })}>
            {data.projects.map((item, index) => (
              <Grid key={index}>
                <Input placeholder="Project name" value={item.name} onChange={(e) => updateArray("projects", index, { name: e.target.value })} />
                <Textarea placeholder="Description" value={item.description} onChange={(e) => updateArray("projects", index, { description: e.target.value })} />
                <Input placeholder="Technologies" value={item.technologies} onChange={(e) => updateArray("projects", index, { technologies: e.target.value })} />
                <Input placeholder="GitHub link" value={item.github} onChange={(e) => updateArray("projects", index, { github: e.target.value })} />
                <Input placeholder="Live link" value={item.live} onChange={(e) => updateArray("projects", index, { live: e.target.value })} />
              </Grid>
            ))}
          </Collection>

          <Collection title="Education" items={data.education} addLabel="Add education" onAdd={() => setData({ ...data, education: [...data.education, { college: "", degree: "", cgpa: "", startDate: "", endDate: "" }] })}>
            {data.education.map((item, index) => (
              <Grid key={index}>
                <Input placeholder="College" value={item.college} onChange={(e) => updateArray("education", index, { college: e.target.value })} />
                <Input placeholder="Degree" value={item.degree} onChange={(e) => updateArray("education", index, { degree: e.target.value })} />
                <Input placeholder="CGPA" value={item.cgpa} onChange={(e) => updateArray("education", index, { cgpa: e.target.value })} />
                <DateField label="Start month" value={item.startDate} onChange={(value) => updateArray("education", index, { startDate: value })} />
                <DateField label="End month" value={item.endDate} onChange={(value) => updateArray("education", index, { endDate: value })} />
              </Grid>
            ))}
          </Collection>

          <Collection title="Certifications" items={data.certifications} addLabel="Add certification" onAdd={() => setData({ ...data, certifications: [...data.certifications, { name: "", provider: "", date: "" }] })}>
            {data.certifications.map((item, index) => (
              <Grid key={index}>
                <Input placeholder="Certification name" value={item.name} onChange={(e) => updateArray("certifications", index, { name: e.target.value })} />
                <Input placeholder="Provider" value={item.provider} onChange={(e) => updateArray("certifications", index, { provider: e.target.value })} />
                <DateField label="Certification month" value={item.date} onChange={(value) => updateArray("certifications", index, { date: value })} />
              </Grid>
            ))}
          </Collection>

          <Collection title="Achievements" items={data.achievements} addLabel="Add achievement" onAdd={() => setData({ ...data, achievements: [...data.achievements, { title: "", description: "" }] })}>
            {data.achievements.map((item, index) => (
              <Grid key={index}>
                <Input placeholder="Achievement title" value={item.title} onChange={(e) => updateArray("achievements", index, { title: e.target.value })} />
                <Textarea placeholder="Achievement description" value={item.description} onChange={(e) => updateArray("achievements", index, { description: e.target.value })} />
              </Grid>
            ))}
          </Collection>
        </motion.aside>

        <section className="relative overflow-auto rounded-lg border border-border bg-muted/40 p-4">
          <ResumePreview data={data} zoom={zoom} />
        </section>
      </div>
    </main>
  );

  function updateArray<K extends "experience" | "projects" | "education" | "certifications" | "achievements">(key: K, index: number, patch: Partial<ResumeData[K][number]>) {
    const next = [...data[key]] as ResumeData[K];
    next[index] = { ...next[index], ...patch };
    setData({ ...data, [key]: next });
  }
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-border bg-white p-4"><h2 className="mb-3 font-semibold">{title}</h2>{children}</section>;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}

function Collection<T>({ title, children, onAdd, addLabel }: { title: string; items: T[]; children: React.ReactNode; onAdd: () => void; addLabel: string }) {
  return (
    <Panel title={title}>
      <div className="space-y-4">{children}</div>
      <Button className="mt-3" variant="secondary" onClick={onAdd}><Plus size={16} /> {addLabel}</Button>
    </Panel>
  );
}

function DateField({
  disabled = false,
  label,
  value,
  onChange
}: {
  disabled?: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    if (disabled) return;
    inputRef.current?.focus();
    inputRef.current?.showPicker?.();
  }

  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-md border border-border bg-white px-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${disabled ? "cursor-not-allowed opacity-60" : "hover:bg-muted/40"}`}
      disabled={disabled}
      type="button"
      onClick={openPicker}
    >
      <span className={value ? "text-foreground" : "text-muted-foreground"}>{value ? formatMonthLabel(value) : label}</span>
      <input
        aria-label={label}
        className="h-0 w-0 opacity-0"
        disabled={disabled}
        ref={inputRef}
        tabIndex={-1}
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="text-xs text-muted-foreground">Pick</span>
    </button>
  );
}

function formatMonthLabel(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})/);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatPersonalField(field: typeof requiredPersonalFields[number]) {
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
