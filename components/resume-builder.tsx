"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, Copy, Download, Eye, EyeOff, GripVertical, LayoutTemplate, Minus, Plus, RotateCcw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { ResumePreview } from "@/templates/resume-preview";
import type { ResumeData, ResumeTextColorKey, TemplateId } from "@/types/resume";
import { resumeThemes } from "@/templates/resume-options";
import { sectionsFromResumeData } from "@/utils/resume";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Textarea } from "@/components/ui/input";
import { MainNav } from "@/components/main-nav";
import { WordLoader } from "@/components/page-loader";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ResumeShareInfo } from "@/lib/resume-share";

const skillSuggestions = ["React", "JavaScript", "React-Native", "Next.js", "TypeScript", "Node.js", "Basic HTML", "Angular", "PostgreSQL", "MySQL", "MongoDB", "Prisma", "Docker", "AWS", "Git"];
const requiredPersonalFields = ["fullName", "email", "phone", "location"] as const;
const draftKey = "resume-builder-draft";
const textColorOptions: Array<{ key: ResumeTextColorKey; label: string; defaultColor: string }> = [
  { key: "name", label: "Name", defaultColor: "#111827" },
  { key: "description", label: "Description", defaultColor: "#374151" },
  { key: "subtitle", label: "Sub titles", defaultColor: "#111827" },
  { key: "meta", label: "Technology, date, links", defaultColor: "#6b7280" }
];
const templatesWithInitials: TemplateId[] = ["modern", "developer", "split"];
const initialsPositions = ["left", "center", "right"] as const;
const maxInitialsImageBytes = 900 * 1024;

export function ResumeBuilder({
  initialData,
  resumeId,
  initialShare,
  user,
  showDonation = true
}: {
  initialData: ResumeData;
  resumeId?: string;
  initialShare?: ResumeShareInfo;
  user?: { name: string; email: string; role?: string };
  showDonation?: boolean;
}) {
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ResumeData>(initialData);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const [confirmShare, setConfirmShare] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [zoom, setZoom] = useState(0.78);
  const [draggingSkill, setDraggingSkill] = useState<string | null>(null);
  const [share, setShare] = useState<ResumeShareInfo>(initialShare ?? { isPublic: false, shareSlug: null });
  const [sharing, setSharing] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  useEffect(() => {
    if (resumeId) return;
    const stored = sessionStorage.getItem(draftKey);
    if (!stored) return;
    try {
      const draft = JSON.parse(stored) as ResumeData;
      setData({ ...draft, textColors: draft.textColors ?? {}, initialsStyle: draft.initialsStyle ?? {}, templateId: initialData.templateId, themeId: initialData.themeId });
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

    toast.warning(`Missing: ${missing.map(formatPersonalField).join(", ")}`);
    return false;
  }

  async function save() {
    if (!validatePersonalDetails()) return;
    setSaving(true);
    try {
      const result = await persistResume();
      toast.success("Saved");
      if (!resumeId) router.replace(`/builder/${result.resume.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
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
      toast.error(error instanceof Error ? error.message : "Template failed");
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
      const cleanupPdfSizing = fitPdfPreviewToFullPages(pdfRef.current);
      const html2pdf = (await import("html2pdf.js")).default;
      try {
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
      } finally {
        cleanupPdfSizing();
      }
      toast.success("Downloaded");
      setConfirmDownload(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    } finally {
      setExporting(false);
    }
  }

  function addSkill(skill: string) {
    const clean = skill.trim();
    if (!clean || data.skills.includes(clean)) return;
    setData({ ...data, skills: [...data.skills, clean] });
  }

  function updateInitialsStyle(patch: Partial<ResumeData["initialsStyle"]>) {
    setData({
      ...data,
      initialsStyle: {
        ...data.initialsStyle,
        ...patch
      }
    });
  }

  function uploadInitialsImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > maxInitialsImageBytes) {
      toast.error("Image must be under 900 KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropImage(reader.result);
        setCropZoom(1);
        setCropX(0);
        setCropY(0);
      }
    };
    reader.onerror = () => toast.error("Unable to load image");
    reader.readAsDataURL(file);
  }

  async function applyInitialsCrop() {
    if (!cropImage) return;

    try {
      const croppedImage = await cropSquareImage(cropImage, { x: cropX, y: cropY, zoom: cropZoom });
      updateInitialsStyle({ image: croppedImage });
      setCropImage(null);
    } catch {
      toast.error("Unable to crop image");
    }
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

  async function toggleShare() {
    if (!resumeId || sharing) return;
    setSharing(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/share`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPublic: !share.isPublic })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setShare(result.share);
      toast.success(result.share.isPublic ? "Public" : "Private");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Share failed");
    } finally {
      setSharing(false);
      setConfirmShare(false);
    }
  }

  async function copyShareLink() {
    if (!share.shareSlug) return;
    const url = `${window.location.origin}/share/${share.shareSlug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Copied");
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
      {user && <MainNav user={user} showDonation={showDonation} />}
      <header className="sticky top-[65px] z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface" href="/dashboard" title="Back">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <Input className="h-9 w-64 font-semibold" value={data.title} onChange={(event) => setData({ ...data, title: event.target.value })} />
              <div className="mt-2 flex w-64 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <span className="w-9 text-right text-xs font-semibold text-muted-foreground">{progress}%</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Button size="icon" variant="secondary" onClick={() => setZoom((value) => Math.max(0.55, value - 0.08))} title="Zoom out"><Minus size={16} /></Button>
            <Button size="icon" variant="secondary" onClick={() => setZoom((value) => Math.min(1, value + 0.08))} title="Zoom in"><Plus size={16} /></Button>
            <Button variant="secondary" onClick={save} loading={saving} loadingText="Saving"><Save size={16} /> Save</Button>
            {resumeId && (
              <>
                <div className="relative">
                  <Button
                    aria-expanded={visibilityOpen}
                    aria-haspopup="menu"
                    variant="secondary"
                    onClick={() => setVisibilityOpen((value) => !value)}
                  >
                    {share.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
                    Visibility
                    <ChevronDown size={15} />
                  </Button>
                  {visibilityOpen && (
                    <div className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Status</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold ${share.isPublic ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                          {share.isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
                          {share.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                      <button
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted"
                        disabled={sharing}
                        type="button"
                        onClick={() => {
                          setVisibilityOpen(false);
                          setConfirmShare(true);
                        }}
                      >
                        <span>{share.isPublic ? "Make private" : "Make public"}</span>
                        {share.isPublic ? <EyeOff className="text-muted-foreground" size={15} /> : <Eye className="text-muted-foreground" size={15} />}
                      </button>
                    </div>
                  )}
                </div>
                {share.shareSlug && (
                  <Button size="icon" variant="secondary" onClick={copyShareLink} title="Copy public link">
                    <Copy size={16} />
                  </Button>
                )}
                <Button onClick={requestPdfDownload} loading={exporting} loadingText="Preparing PDF">
                  <Download size={16} /> PDF
                </Button>
              </>
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
        open={confirmDownload && !exporting}
        title="Save before downloading?"
        onCancel={() => {
          if (!exporting) setConfirmDownload(false);
        }}
        onConfirm={downloadPdf}
      />

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={share.isPublic ? "Make Private" : "Make Public"}
        description={
          share.isPublic
            ? "Visitors will no longer be able to view this resume from the public link. The link slug stays reserved if you share it again later."
            : "Anyone with the public link will be able to view this resume in read-only mode."
        }
        loading={sharing}
        open={confirmShare}
        title={share.isPublic ? "Make resume private?" : "Make resume public?"}
        onCancel={() => {
          if (!sharing) setConfirmShare(false);
        }}
        onConfirm={toggleShare}
      />

      {cropImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="crop-title">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface text-surface-foreground shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <h2 className="font-semibold" id="crop-title">Crop image</h2>
              <button
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                type="button"
                aria-label="Close crop"
                onClick={() => setCropImage(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div className="mx-auto h-56 w-56 overflow-hidden border border-border bg-muted" style={{ borderRadius: data.initialsStyle.shape === "round" ? "9999px" : "0px" }}>
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${cropImage})`,
                    backgroundPosition: `${50 + cropX}% ${50 + cropY}%`,
                    backgroundSize: `${100 * cropZoom}%`
                  }}
                />
              </div>
              <CropSlider label="Zoom" max={3} min={1} step={0.05} value={cropZoom} onChange={setCropZoom} />
              <CropSlider label="Horizontal" max={50} min={-50} step={1} value={cropX} onChange={setCropX} />
              <CropSlider label="Vertical" max={50} min={-50} step={1} value={cropY} onChange={setCropY} />
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <Button type="button" variant="secondary" onClick={() => setCropImage(null)}>Cancel</Button>
              <Button type="button" onClick={applyInitialsCrop}>Use image</Button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed -left-[10000px] top-0 opacity-0" aria-hidden="true">
        <div ref={pdfRef}>
          <ResumePreview data={data} zoom={1} compact appearance="light" />
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

          <Panel title="Text Colors">
            <div className="grid gap-3">
              {textColorOptions.map((option) => (
                <ColorField
                  defaultColor={option.defaultColor}
                  key={option.key}
                  label={option.label}
                  value={data.textColors[option.key]}
                  onChange={(color) => setData({
                    ...data,
                    textColors: {
                      ...data.textColors,
                      [option.key]: color
                    }
                  })}
                  onReset={() => {
                    const nextColors = { ...data.textColors };
                    delete nextColors[option.key];
                    setData({ ...data, textColors: nextColors });
                  }}
                />
              ))}
            </div>
            <Button
              className="mt-4 w-full"
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setData({ ...data, textColors: {} })}
            >
              <RotateCcw size={15} /> Reset defaults
            </Button>
          </Panel>

          {templatesWithInitials.includes(data.templateId) && (
            <Panel title="Initials">
              <div className="grid gap-3">
                <ColorField
                  defaultColor="#ffffff"
                  label="Letter"
                  value={data.initialsStyle.letterColor}
                  onChange={(color) => updateInitialsStyle({ letterColor: color })}
                  onReset={() => {
                    const nextStyle = { ...data.initialsStyle };
                    delete nextStyle.letterColor;
                    setData({ ...data, initialsStyle: nextStyle });
                  }}
                />
                <ColorField
                  defaultColor="#020617"
                  label="Box"
                  value={data.initialsStyle.boxColor}
                  onChange={(color) => updateInitialsStyle({ boxColor: color })}
                  onReset={() => {
                    const nextStyle = { ...data.initialsStyle };
                    delete nextStyle.boxColor;
                    setData({ ...data, initialsStyle: nextStyle });
                  }}
                />
                <div className="rounded-md border border-border bg-muted/35 px-3 py-2">
                  <p className="mb-2 text-sm font-medium">Box shape</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["square", "round"] as const).map((shape) => (
                      <button
                        className={`h-9 rounded-md border text-sm font-medium transition ${((data.initialsStyle.shape ?? "square") === shape) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-muted"}`}
                        key={shape}
                        type="button"
                        onClick={() => updateInitialsStyle({ shape })}
                      >
                        {shape === "square" ? "Square" : "Round"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/35 px-3 py-2">
                  <p className="mb-2 text-sm font-medium">Box position</p>
                  <div className="grid grid-cols-3 gap-2">
                    {initialsPositions.map((position) => (
                      <button
                        className={`h-9 rounded-md border text-sm font-medium capitalize transition ${((data.initialsStyle.position ?? "left") === position) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-muted"}`}
                        key={position}
                        type="button"
                        onClick={() => updateInitialsStyle({ position })}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/35 px-3 py-2">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Box scale</p>
                    <span className="text-xs font-semibold text-muted-foreground">{(data.initialsStyle.scale ?? 1).toFixed(2)}x</span>
                  </div>
                  <input
                    aria-label="Initials box scale"
                    className="w-full accent-primary"
                    max={2.5}
                    min={1}
                    step={0.05}
                    type="range"
                    value={data.initialsStyle.scale ?? 1}
                    onChange={(event) => updateInitialsStyle({ scale: Number(event.target.value) })}
                  />
                  <div className="mt-1 flex justify-between text-[11px] font-medium text-muted-foreground">
                    <span>1x</span>
                    <span>2.5x</span>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/35 px-3 py-2">
                  <p className="mb-2 text-sm font-medium">Image</p>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium transition hover:bg-muted">
                      Upload
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        type="file"
                        onChange={(event) => {
                          uploadInitialsImage(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {data.initialsStyle.image && (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-10 w-10 overflow-hidden border border-border bg-surface bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${data.initialsStyle.image})`,
                            borderRadius: data.initialsStyle.shape === "round" ? "9999px" : "0px"
                          }}
                        />
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const nextStyle = { ...data.initialsStyle };
                            delete nextStyle.image;
                            setData({ ...data, initialsStyle: nextStyle });
                          }}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                disabled={Object.keys(data.initialsStyle).length === 0}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => setData({ ...data, initialsStyle: {} })}
              >
                <RotateCcw size={15} /> Reset initials
              </Button>
            </Panel>
          )}

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
                <button className="rounded border border-border bg-surface px-2 py-1 text-xs" key={suggestion} onClick={() => setData({ ...data, summary: suggestion })}>{suggestion}</button>
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
                <label className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
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

function fitPdfPreviewToFullPages(root: HTMLElement) {
  const pageHeight = 1056;
  const paper = root.querySelector<HTMLElement>("[data-resume-paper]");
  const fillPageNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-resume-fill-page]"));
  if (!paper) return () => {};

  paper.style.minHeight = "";
  fillPageNodes.forEach((node) => {
    node.style.minHeight = "";
  });

  const fullHeight = Math.max(pageHeight, Math.ceil(paper.scrollHeight / pageHeight) * pageHeight);
  const previousPaperMinHeight = paper.style.minHeight;
  const previousFillMinHeights = fillPageNodes.map((node) => node.style.minHeight);

  paper.style.minHeight = `${fullHeight}px`;
  fillPageNodes.forEach((node) => {
    node.style.minHeight = `${fullHeight}px`;
  });

  return () => {
    paper.style.minHeight = previousPaperMinHeight;
    fillPageNodes.forEach((node, index) => {
      node.style.minHeight = previousFillMinHeights[index] ?? "";
    });
  };
}

function cropSquareImage(source: string, crop: { x: number; y: number; zoom: number }) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas is unavailable"));
        return;
      }

      const scale = Math.max(size / image.width, size / image.height) * crop.zoom;
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (size - width) * ((50 + crop.x) / 100);
      const y = (size - height) * ((50 + crop.y) / 100);

      context.drawImage(image, x, y, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.onerror = () => reject(new Error("Image failed to load"));
    image.src = source;
  });
}

function CropSlider({
  label,
  max,
  min,
  step,
  value,
  onChange
}: {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs font-semibold text-muted-foreground">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        className="w-full accent-primary"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="rounded-lg border border-border bg-surface">
      <button
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        type="button"
        onClick={() => setCollapsed((value) => !value)}
      >
        <h2 className="font-semibold">{title}</h2>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : "rotate-0"}`} />
      </button>
      {!collapsed && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
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

function ColorField({
  defaultColor,
  label,
  value,
  onChange,
  onReset
}: {
  defaultColor: string;
  label: string;
  value?: string;
  onChange: (color: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/35 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: defaultColor }} />
          <span>{value ? "Custom" : "Default"}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          aria-label={`${label} color`}
          className="h-9 w-10 cursor-pointer rounded border border-border bg-surface p-1"
          type="color"
          value={value ?? defaultColor}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button disabled={!value} size="icon" type="button" variant="ghost" onClick={onReset} title={`Reset ${label}`}>
          <RotateCcw size={15} />
        </Button>
      </div>
    </div>
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
      className={`flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${disabled ? "cursor-not-allowed opacity-60" : "hover:bg-muted/40"}`}
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
