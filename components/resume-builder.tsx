"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarClock, Check, ChevronDown, Copy, Download, Eye, EyeOff, FileDiff, GripVertical, LayoutTemplate, Minus, Plus, Redo2, RotateCcw, Save, Sparkles, Target, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { ResumePreview } from "@/templates/resume-preview";
import type { ResumeData, ResumeSectionKey, ResumeTextColorKey, TemplateId } from "@/types/resume";
import { resumeThemes } from "@/templates/resume-options";
import { sectionsFromResumeData } from "@/utils/resume";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Textarea } from "@/components/ui/input";
import { MainNav } from "@/components/main-nav";
import { WordLoader } from "@/components/page-loader";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AiEnhanceUsage } from "@/lib/ai-enhance";
import type { ResumeShareInfo } from "@/lib/resume-share";

const skillSuggestions = ["React", "JavaScript", "React-Native", "Next.js", "TypeScript", "Node.js", "Basic HTML", "Angular", "PostgreSQL", "MySQL", "MongoDB", "Prisma", "Docker", "AWS", "Git"];
const requiredPersonalFields = ["fullName", "email", "phone", "location"] as const;
const resumeEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resumePhonePattern = /^\d{10}$/;
const draftKey = "resume-builder-draft";
const textColorOptions: Array<{ key: ResumeTextColorKey; label: string; defaultColor: string }> = [
  { key: "name", label: "Name", defaultColor: "#111827" },
  { key: "description", label: "Description", defaultColor: "#374151" },
  { key: "subtitle", label: "Sub titles", defaultColor: "#111827" },
  { key: "meta", label: "Technology, date, links", defaultColor: "#6b7280" },
  { key: "background", label: "Background", defaultColor: "#ffffff" }
];
const templatesWithInitials: TemplateId[] = ["modern", "developer", "split"];
const initialsPositions = ["left", "center", "right"] as const;
const maxInitialsImageBytes = 5 * 1024 * 1024;
const enhancementStages = [
  "Extracting data",
  "Sent to AI",
  "Received AI enhanced data",
  "Replacing current data"
];
const minimumEnhancementStageMs = 1000;
type AiEnhanceHistory = {
  before: ResumeData;
  after: ResumeData;
  state: "applied" | "undone";
} | null;
type FinalizeAction = "save" | "download";

export function ResumeBuilder({
  initialData,
  initialAiEnhanceUsage,
  resumeId,
  initialShare,
  user,
  showDonation = true
}: {
  initialData: ResumeData;
  initialAiEnhanceUsage?: AiEnhanceUsage;
  resumeId?: string;
  initialShare?: ResumeShareInfo;
  user?: { name: string; email: string; role?: string };
  showDonation?: boolean;
}) {
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [data, setData] = useState<ResumeData>(initialData);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancementStage, setEnhancementStage] = useState(0);
  const [enhancementModelStatus, setEnhancementModelStatus] = useState("Using Model 1");
  const [confirmEnhance, setConfirmEnhance] = useState(false);
  const [confirmAiPolish, setConfirmAiPolish] = useState<FinalizeAction | null>(null);
  const [aiPolishPromptDismissed, setAiPolishPromptDismissed] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string | null>(null);
  const [dailyLimitOpen, setDailyLimitOpen] = useState(false);
  const [targetJobEnabled, setTargetJobEnabled] = useState(false);
  const [targetJobRequirement, setTargetJobRequirement] = useState("");
  const [aiEnhanceHistory, setAiEnhanceHistory] = useState<AiEnhanceHistory>(null);
  const [aiDiffOpen, setAiDiffOpen] = useState(false);
  const [aiEnhanceUsage, setAiEnhanceUsage] = useState<AiEnhanceUsage | undefined>(initialAiEnhanceUsage);
  const [exporting, setExporting] = useState(false);
  const [confirmDownload, setConfirmDownload] = useState(false);
  const [confirmShare, setConfirmShare] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [zoom, setZoom] = useState(0.78);
  const [draggingSkill, setDraggingSkill] = useState<string | null>(null);
  const [share, setShare] = useState<ResumeShareInfo>(initialShare ?? { isPublic: false, shareSlug: null, viewCount: 0 });
  const [sharing, setSharing] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropOriginalImage, setCropOriginalImage] = useState<string | null>(null);
  const [initialsOriginalImage, setInitialsOriginalImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  useEffect(() => {
    if (resumeId) return;
    const stored = sessionStorage.getItem(draftKey);
    if (!stored) return;
    try {
      const draft = JSON.parse(stored) as ResumeData;
      setData({ ...draft, textColors: draft.textColors ?? {}, hiddenSections: draft.hiddenSections ?? [], initialsStyle: draft.initialsStyle ?? {}, templateId: initialData.templateId, themeId: initialData.themeId, themeColor: draft.themeColor ?? initialData.themeColor });
      sessionStorage.removeItem(draftKey);
    } catch {
      sessionStorage.removeItem(draftKey);
    }
  }, [initialData.templateId, initialData.themeColor, initialData.themeId, resumeId]);

  useEffect(() => {
    if (!cropImage) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [cropImage]);
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
    if (missing.length > 0) {
      toast.warning(`Missing: ${missing.map(formatPersonalField).join(", ")}`);
      return false;
    }

    const errors = getPersonalValidationErrors();
    const messages = Object.values(errors);
    if (messages.length === 0) return true;

    toast.warning(messages.join(" "));
    return false;
  }

  function validateResumeDetails() {
    if (!validatePersonalDetails()) return false;
    const educationErrors = getEducationScoreErrors();
    if (educationErrors.length > 0) {
      toast.warning(educationErrors[0]);
      return false;
    }
    return true;
  }

  function getPersonalValidationErrors() {
    const errors: Partial<Record<"email" | "phone", string>> = {};
    const email = data.personal.email.trim();
    const phone = data.personal.phone.trim();

    if (email && !resumeEmailPattern.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (phone && !resumePhonePattern.test(phone)) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }

    return errors;
  }

  function getEducationScoreErrors() {
    return data.education.flatMap((item, index) => {
      const value = item.cgpa.trim();
      if (!value) return [];
      const score = Number(value.replace(/%$/, ""));
      if (!Number.isFinite(score)) {
        return [`Education ${index + 1}: enter a valid ${(item.scoreType ?? "cgpa") === "percentage" ? "percentage" : "CGPA"}.`];
      }
      if ((item.scoreType ?? "cgpa") === "percentage") {
        return score < 1 || score > 100 ? [`Education ${index + 1}: percentage must be between 1 and 100.`] : [];
      }
      return score < 1 || score > 10 ? [`Education ${index + 1}: CGPA must be between 1 and 10.`] : [];
    });
  }

  function shouldSuggestAiPolish() {
    if (aiPolishPromptDismissed) return false;
    if (aiEnhanceHistory?.state === "applied") return false;
    if (aiEnhanceUsage?.blocked) return false;
    if (typeof aiEnhanceUsage?.remaining === "number" && aiEnhanceUsage.remaining <= 0) return false;
    return progress >= 45;
  }

  function requestSave() {
    if (!validateResumeDetails()) return;
    if (shouldSuggestAiPolish()) {
      setConfirmAiPolish("save");
      return;
    }
    void save();
  }

  async function save() {
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

  function requestAiEnhancement() {
    if (enhancing) return;
    if (!validateResumeDetails()) return;
    if (aiEnhanceUsage?.blocked) {
      toast.error("AI enhancement is blocked for your account.");
      return;
    }
    if (typeof aiEnhanceUsage?.remaining === "number" && aiEnhanceUsage.remaining <= 0) {
      setDailyLimitOpen(true);
      return;
    }
    setConfirmEnhance(true);
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
    if (!validateResumeDetails()) return;
    if (shouldSuggestAiPolish()) {
      setConfirmAiPolish("download");
      return;
    }
    setConfirmDownload(true);
  }

  function continueWithoutAiPolish() {
    const action = confirmAiPolish;
    setAiPolishPromptDismissed(true);
    setConfirmAiPolish(null);
    if (action === "save") {
      void save();
      return;
    }
    if (action === "download") setConfirmDownload(true);
  }

  function polishBeforeFinalize() {
    setConfirmAiPolish(null);
    requestAiEnhancement();
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
      toast.error("Image must be under 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        window.scrollTo({ left: 0, top: 0 });
        previewRef.current?.scrollTo({ left: 0, top: 0 });
        setCropImage(reader.result);
        setCropOriginalImage(reader.result);
        setCropZoom(1);
        setCropX(0);
        setCropY(0);
      }
    };
    reader.onerror = () => toast.error("Unable to load image");
    reader.readAsDataURL(file);
  }

  async function enhanceWithAi() {
    if (enhancing) return;

    setEnhancing(true);
    setEnhancementError(null);
    setEnhancementStage(0);
    setEnhancementModelStatus("Using Model 1");
    try {
      await waitForStage();
      setEnhancementStage(1);
      let modelIndex = 0;
      let result: {
        resume: ResumeData;
        usage?: AiEnhanceUsage;
      } | null = null;

      while (!result) {
        setEnhancementModelStatus(`Using Model ${modelIndex + 1}`);
        const response = await fetch("/api/resumes/enhance", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            resume: data,
            jobRequirement: targetJobEnabled ? targetJobRequirement.trim() || undefined : undefined,
            modelIndex
          })
        });
        const responseResult = await response.json();
        if (response.ok) {
          result = responseResult;
          break;
        }
        if (responseResult.retryable && typeof responseResult.nextModelIndex === "number") {
          setEnhancementModelStatus(responseResult.error ?? `Model ${modelIndex + 1} is handling heavy traffic. Trying Model ${responseResult.nextModelIndex + 1}.`);
          await waitForStage();
          modelIndex = responseResult.nextModelIndex;
          continue;
        }
        throw new Error(responseResult.error);
      }

      if (!result) throw new Error("AI enhancement failed. Please try again.");
      const enhancedResult = result;
      setEnhancementStage(2);
      await waitForStage();
      setEnhancementStage(3);
      await waitForStage();
      setAiEnhanceHistory({ before: data, after: enhancedResult.resume, state: "applied" });
      setData(enhancedResult.resume);
      setAiDiffOpen(true);
      if (enhancedResult.usage) setAiEnhanceUsage(enhancedResult.usage);
      toast.success(typeof enhancedResult.usage?.remaining === "number" ? `Enhanced for ATS. ${enhancedResult.usage.remaining} chances left today.` : "Enhanced for ATS");
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI enhancement failed. Please try again.";
      if (message.toLowerCase().includes("chances for today")) {
        setDailyLimitOpen(true);
      } else {
        setEnhancementError(message);
      }
    } finally {
      setEnhancing(false);
      setEnhancementStage(0);
      setEnhancementModelStatus("Using Model 1");
      setConfirmEnhance(false);
    }
  }

  function readjustInitialsImage() {
    const sourceImage = initialsOriginalImage ?? data.initialsStyle.originalImage ?? data.initialsStyle.image;
    if (!sourceImage) return;
    window.scrollTo({ left: 0, top: 0 });
    previewRef.current?.scrollTo({ left: 0, top: 0 });
    setCropImage(sourceImage);
    setCropOriginalImage(sourceImage);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
  }

  function undoAiEnhancement() {
    if (!aiEnhanceHistory || aiEnhanceHistory.state === "undone") return;
    setData(aiEnhanceHistory.before);
    setAiEnhanceHistory({ ...aiEnhanceHistory, state: "undone" });
    toast.success("AI enhancement undone");
  }

  function redoAiEnhancement() {
    if (!aiEnhanceHistory || aiEnhanceHistory.state === "applied") return;
    setData(aiEnhanceHistory.after);
    setAiEnhanceHistory({ ...aiEnhanceHistory, state: "applied" });
    toast.success("AI enhancement restored");
  }

  async function applyInitialsCrop() {
    if (!cropImage) return;

    try {
      const croppedImage = await cropSquareImage(cropImage, { x: cropX, y: cropY, zoom: cropZoom });
      setCropImage(null);
      const originalImage = cropOriginalImage ?? data.initialsStyle.originalImage ?? cropImage;
      setCropOriginalImage(null);
      setInitialsOriginalImage(originalImage);
      updateInitialsStyle({ image: croppedImage });
      requestAnimationFrame(() => {
        window.scrollTo({ left: 0, top: 0 });
        previewRef.current?.scrollTo({ left: 0, top: 0 });
      });
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
    <main className="min-h-screen bg-background lg:fixed lg:inset-0 lg:flex lg:flex-col lg:overflow-hidden">
      {user && <MainNav user={user} showDonation={showDonation} />}
      <header className="sticky top-[65px] z-20 shrink-0 border-b border-border bg-surface/95 backdrop-blur lg:static">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
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
            <Button variant="secondary" onClick={requestAiEnhancement} loading={enhancing} loadingText="Enhancing" disabled={saving || exporting}>
              <Sparkles size={16} /> Enhance with AI
            </Button>
            {aiEnhanceHistory && (
              <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
                <Button
                  disabled={saving || exporting || enhancing}
                  size="icon"
                  title="View AI Enhancements"
                  type="button"
                  variant="ghost"
                  onClick={() => setAiDiffOpen(true)}
                >
                  <FileDiff size={16} />
                </Button>
                <Button
                  disabled={saving || exporting || enhancing || aiEnhanceHistory.state === "undone"}
                  size="icon"
                  title="Undo AI enhancement"
                  type="button"
                  variant="ghost"
                  onClick={undoAiEnhancement}
                >
                  <Undo2 size={16} />
                </Button>
                <Button
                  disabled={saving || exporting || enhancing || aiEnhanceHistory.state === "applied"}
                  size="icon"
                  title="Redo AI enhancement"
                  type="button"
                  variant="ghost"
                  onClick={redoAiEnhancement}
                >
                  <Redo2 size={16} />
                </Button>
              </div>
            )}
            <Button variant="secondary" onClick={requestSave} loading={saving} loadingText="Saving"><Save size={16} /> Save</Button>
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
                      {share.isPublic && (
                        <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                          Views: {share.viewCount}
                        </div>
                      )}
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

      {(saving || exporting || enhancing) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
          {enhancing ? (
            <EnhancementStageLoader currentStage={enhancementStage} modelStatus={enhancementModelStatus} />
          ) : (
            <WordLoader
              label={saving ? "Saving" : "Preparing"}
              words={saving ? ["resume", "sections", "preview", "changes", "data"] : ["PDF", "layout", "pages", "download", "resume"]}
            />
          )}
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
        cancelLabel={confirmAiPolish === "save" ? "Save anyway" : "Generate PDF anyway"}
        confirmLabel={<><Sparkles size={16} /> Polish with AI</>}
        description={<AiPolishNudgeContent action={confirmAiPolish} />}
        open={confirmAiPolish !== null}
        title="One last polish?"
        onCancel={continueWithoutAiPolish}
        onConfirm={polishBeforeFinalize}
        onDismiss={() => setConfirmAiPolish(null)}
      />

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={<><Sparkles size={16} /> Enhance with AI</>}
        description={getEnhanceConfirmDescription({
          enabled: targetJobEnabled,
          jobRequirement: targetJobRequirement,
          onEnabledChange: setTargetJobEnabled,
          onJobRequirementChange: setTargetJobRequirement,
          usage: aiEnhanceUsage
        })}
        loading={enhancing}
        open={confirmEnhance && !enhancing}
        size="lg"
        title="Enhance resume with AI?"
        onCancel={() => {
          if (!enhancing) setConfirmEnhance(false);
        }}
        onConfirm={enhanceWithAi}
      />

      <ConfirmDialog
        cancelLabel={null}
        confirmLabel="Got it"
        description={<DailyLimitContent />}
        open={dailyLimitOpen}
        title="Daily AI limit reached"
        onCancel={() => setDailyLimitOpen(false)}
        onConfirm={() => setDailyLimitOpen(false)}
      />

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={<><RotateCcw size={16} /> Retry</>}
        description={<EnhanceErrorContent message={enhancementError} />}
        open={enhancementError !== null && !enhancing}
        title="AI enhancement failed"
        variant="danger"
        onCancel={() => setEnhancementError(null)}
        onConfirm={enhanceWithAi}
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

      {aiEnhanceHistory && (
        <AiDiffModal
          history={aiEnhanceHistory}
          open={aiDiffOpen}
          onClose={() => setAiDiffOpen(false)}
        />
      )}

      {cropImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="crop-title">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface text-surface-foreground shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <h2 className="font-semibold" id="crop-title">Crop image</h2>
              <button
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                type="button"
                aria-label="Close crop"
                onClick={() => {
                  setCropImage(null);
                  setCropOriginalImage(null);
                }}
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCropImage(null);
                  setCropOriginalImage(null);
                }}
              >
                Cancel
              </Button>
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

      <div className="grid w-full gap-6 px-4 py-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(360px,34vw)_minmax(0,1fr)] lg:items-start lg:overflow-hidden lg:px-6 lg:pb-0">
        <motion.aside initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-2">
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
                    onClick={() => setData({ ...data, themeId: theme.id, themeColor: undefined })}
                  >
                    {!data.themeColor && data.themeId === theme.id && (
                      <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-blue-600">
                        <Check size={15} color={theme.text} />
                      </span>
                    )}
                  </button>
                ))}
                <label className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-surface shadow-sm" title="Custom color">
                  <input
                    aria-label="Choose custom theme color"
                    className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    type="color"
                    value={data.themeColor ?? resumeThemes.find((theme) => theme.id === data.themeId)?.color ?? "#d14550"}
                    onChange={(event) => setData({ ...data, themeColor: event.target.value })}
                  />
                </label>
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
                <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/35 px-3 py-2">
                  <span className="text-sm font-medium">Show initials/photo box</span>
                  <input
                    checked={!data.initialsStyle.hidden}
                    className="h-4 w-4 accent-primary"
                    type="checkbox"
                    onChange={(event) => updateInitialsStyle({ hidden: !event.target.checked })}
                  />
                </label>
                {data.initialsStyle.hidden ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Initials/photo box is hidden in the resume preview.
                  </p>
                ) : (
                  <>
                    {!data.initialsStyle.image && (
                      <>
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
                      </>
                    )}
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
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium transition hover:bg-muted"
                      type="button"
                      onClick={() => {
                        window.scrollTo({ left: 0, top: 0 });
                        previewRef.current?.scrollTo({ left: 0, top: 0 });
                        imageInputRef.current?.click();
                      }}
                    >
                      Upload
                    </button>
                    <input
                      ref={imageInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      type="file"
                      onChange={(event) => {
                        uploadInitialsImage(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
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
                          onClick={readjustInitialsImage}
                        >
                          Re-adjust
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const nextStyle = { ...data.initialsStyle };
                            delete nextStyle.image;
                            delete nextStyle.originalImage;
                            setInitialsOriginalImage(null);
                            setData({ ...data, initialsStyle: nextStyle });
                          }}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                  </>
                )}
              </div>
              {!data.initialsStyle.hidden && (
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
              )}
            </Panel>
          )}

          <Panel title="Personal Information">
            {(() => {
              const missing = getMissingPersonalFields();
              const errors = getPersonalValidationErrors();
              const hasNotice = missing.length > 0 || errors.email || errors.phone;

              return hasNotice ? (
              <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {missing.length > 0
                  ? "Full name, email, phone, and location are required before saving or downloading."
                  : [errors.email, errors.phone].filter(Boolean).join(" ")}
              </p>
              ) : null;
            })()}
            <Grid>
              {(["fullName", "email", "phone", "location", "linkedin", "github", "portfolio"] as const).map((key) => {
                const errors = getPersonalValidationErrors();
                const missing = requiredPersonalFields.includes(key as typeof requiredPersonalFields[number]) && !data.personal[key].trim();
                const invalid = (key === "email" && errors.email) || (key === "phone" && errors.phone);

                return (
                  <Input
                    className={missing || invalid ? "border-amber-300 bg-amber-50/60" : undefined}
                    inputMode={key === "phone" ? "numeric" : undefined}
                    key={key}
                    maxLength={key === "phone" ? 10 : undefined}
                    placeholder={key.replace(/([A-Z])/g, " $1")}
                    type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                    value={data.personal[key]}
                    onChange={(event) => setData({ ...data, personal: { ...data.personal, [key]: key === "phone" ? event.target.value.replace(/\D/g, "").slice(0, 10) : event.target.value } })}
                  />
                );
              })}
            </Grid>
          </Panel>

          <Panel title={`Professional Summary (${data.summary.length}/600)`} actions={<SectionVisibilityToggle hidden={isSectionHidden("summary")} sectionName="summary" onToggle={() => toggleSectionVisibility("summary")} />}>
            <Textarea maxLength={600} value={data.summary} onChange={(event) => setData({ ...data, summary: event.target.value })} placeholder="Impact-focused summary for the target role." />
            <div className="mt-2 flex flex-wrap gap-2">
              {["Frontend engineer with product instincts", "Backend engineer focused on reliable systems", "Full-stack developer shipping polished user experiences"].map((suggestion) => (
                <button className="rounded border border-border bg-surface px-2 py-1 text-xs" key={suggestion} onClick={() => setData({ ...data, summary: suggestion })}>{suggestion}</button>
              ))}
            </div>
          </Panel>

          <Panel title="Skills" actions={<SectionVisibilityToggle hidden={isSectionHidden("skills")} sectionName="skills" onToggle={() => toggleSectionVisibility("skills")} />}>
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); const input = event.currentTarget.elements.namedItem("skill") as HTMLInputElement; addSkill(input.value); input.value = ""; }}>
              <Input name="skill" placeholder="Add a skill" />
              <Button type="submit" size="icon"><Plus size={16} /></Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {skillSuggestions.map((skill) => <button className="rounded border border-border px-2 py-1 text-xs" key={skill} onClick={() => addSkill(skill)}>{skill}</button>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
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
                  <span>{index + 1}. {skill}</span>
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

          <Collection title="Experience" items={data.experience} addLabel="Add experience" actions={<SectionVisibilityToggle hidden={isSectionHidden("experience")} sectionName="experience" onToggle={() => toggleSectionVisibility("experience")} />} onAdd={() => setData({ ...data, experience: [...data.experience, { company: "", role: "", startDate: "", endDate: "", current: false, description: "" }] })}>
            {data.experience.map((item, index) => (
              <CollectionItem key={index} title={`Experience ${index + 1}`} onRemove={() => removeArrayItem("experience", index)}>
                <Grid>
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
              </CollectionItem>
            ))}
          </Collection>

          <Collection title="Projects" items={data.projects} addLabel="Add project" actions={<SectionVisibilityToggle hidden={isSectionHidden("projects")} sectionName="projects" onToggle={() => toggleSectionVisibility("projects")} />} onAdd={() => setData({ ...data, projects: [...data.projects, { name: "", description: "", technologies: "", github: "", live: "" }] })}>
            {data.projects.map((item, index) => (
              <CollectionItem key={index} title={`Project ${index + 1}`} onRemove={() => removeArrayItem("projects", index)}>
                <Grid>
                  <Input placeholder="Project name" value={item.name} onChange={(e) => updateArray("projects", index, { name: e.target.value })} />
                  <Textarea placeholder="Description" value={item.description} onChange={(e) => updateArray("projects", index, { description: e.target.value })} />
                  <Input placeholder="Technologies" value={item.technologies} onChange={(e) => updateArray("projects", index, { technologies: e.target.value })} />
                  <Input placeholder="GitHub link" value={item.github} onChange={(e) => updateArray("projects", index, { github: e.target.value })} />
                  <Input placeholder="Live link" value={item.live} onChange={(e) => updateArray("projects", index, { live: e.target.value })} />
                </Grid>
              </CollectionItem>
            ))}
          </Collection>

          <Collection title="Education" items={data.education} addLabel="Add education" actions={<SectionVisibilityToggle hidden={isSectionHidden("education")} sectionName="education" onToggle={() => toggleSectionVisibility("education")} />} onAdd={() => setData({ ...data, education: [...data.education, { college: "", degree: "", cgpa: "", scoreType: "cgpa", startDate: "", endDate: "", description: "" }] })}>
            {getEducationScoreErrors().length > 0 && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {getEducationScoreErrors()[0]}
              </p>
            )}
            {data.education.map((item, index) => (
              <CollectionItem key={index} title={`Education ${index + 1}`} onRemove={() => removeArrayItem("education", index)}>
                <Grid>
                  <Input placeholder="College" value={item.college} onChange={(e) => updateArray("education", index, { college: e.target.value })} />
                  <Input placeholder="Degree" value={item.degree} onChange={(e) => updateArray("education", index, { degree: e.target.value })} />
                  <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                    <ScoreTypePicker value={item.scoreType ?? "cgpa"} onChange={(value) => updateArray("education", index, { scoreType: value })} />
                    <Input
                      className={isEducationScoreInvalid(item) ? "border-amber-300 bg-amber-50/60" : undefined}
                      inputMode="decimal"
                      placeholder={(item.scoreType ?? "cgpa") === "percentage" ? "Percentage" : "CGPA"}
                      value={item.cgpa}
                      onChange={(e) => updateArray("education", index, { cgpa: e.target.value })}
                    />
                  </div>
                  <DateField label="Start month" value={item.startDate} onChange={(value) => updateArray("education", index, { startDate: value })} />
                  <DateField label="End month" value={item.endDate} onChange={(value) => updateArray("education", index, { endDate: value })} />
                  <Textarea placeholder="Description" rows={3} value={item.description} onChange={(e) => updateArray("education", index, { description: e.target.value })} />
                </Grid>
              </CollectionItem>
            ))}
          </Collection>

          <Collection title="Certifications" items={data.certifications} addLabel="Add certification" actions={<SectionVisibilityToggle hidden={isSectionHidden("certifications")} sectionName="certifications" onToggle={() => toggleSectionVisibility("certifications")} />} onAdd={() => setData({ ...data, certifications: [...data.certifications, { name: "", provider: "", date: "", description: "" }] })}>
            {data.certifications.map((item, index) => (
              <CollectionItem key={index} title={`Certification ${index + 1}`} onRemove={() => removeArrayItem("certifications", index)}>
                <Grid>
                  <Input placeholder="Certification name" value={item.name} onChange={(e) => updateArray("certifications", index, { name: e.target.value })} />
                  <Input placeholder="Provider" value={item.provider} onChange={(e) => updateArray("certifications", index, { provider: e.target.value })} />
                  <DateField label="Certification month" value={item.date} onChange={(value) => updateArray("certifications", index, { date: value })} />
                  <Textarea placeholder="Description" rows={3} value={item.description} onChange={(e) => updateArray("certifications", index, { description: e.target.value })} />
                </Grid>
              </CollectionItem>
            ))}
          </Collection>

          <Collection title="Achievements" items={data.achievements} addLabel="Add achievement" actions={<SectionVisibilityToggle hidden={isSectionHidden("achievements")} sectionName="achievements" onToggle={() => toggleSectionVisibility("achievements")} />} onAdd={() => setData({ ...data, achievements: [...data.achievements, { title: "", description: "" }] })}>
            {data.achievements.map((item, index) => (
              <CollectionItem key={index} title={`Achievement ${index + 1}`} onRemove={() => removeArrayItem("achievements", index)}>
                <Grid>
                  <Input placeholder="Achievement title" value={item.title} onChange={(e) => updateArray("achievements", index, { title: e.target.value })} />
                  <Textarea placeholder="Achievement description" value={item.description} onChange={(e) => updateArray("achievements", index, { description: e.target.value })} />
                </Grid>
              </CollectionItem>
            ))}
          </Collection>
        </motion.aside>

        <section ref={previewRef} className="relative overflow-auto rounded-lg border border-border bg-muted/40 p-3 sm:p-4 lg:h-full lg:min-h-0">
          <div className="lg:hidden">
            <ResumePreview data={data} zoom={0.42} fitContent />
          </div>
          <div className="hidden lg:block">
            <ResumePreview data={data} zoom={zoom} />
          </div>
        </section>
      </div>
    </main>
  );

  function updateArray<K extends "experience" | "projects" | "education" | "certifications" | "achievements">(key: K, index: number, patch: Partial<ResumeData[K][number]>) {
    const next = [...data[key]] as ResumeData[K];
    next[index] = { ...next[index], ...patch };
    setData({ ...data, [key]: next });
  }

  function removeArrayItem<K extends "experience" | "projects" | "education" | "certifications" | "achievements">(key: K, index: number) {
    setData({ ...data, [key]: data[key].filter((_, itemIndex) => itemIndex !== index) });
  }

  function isSectionHidden(section: ResumeSectionKey) {
    return (data.hiddenSections ?? []).includes(section);
  }

  function toggleSectionVisibility(section: ResumeSectionKey) {
    const hiddenSections = data.hiddenSections ?? [];
    setData({
      ...data,
      hiddenSections: hiddenSections.includes(section)
        ? hiddenSections.filter((item) => item !== section)
        : [...hiddenSections, section]
    });
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

function EnhancementStageLoader({ currentStage, modelStatus }: { currentStage: number; modelStatus: string }) {
  const keywords = ["keywords", "impact", "clarity", "ATS"];

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface text-surface-foreground shadow-[0_30px_90px_rgba(2,6,23,0.32)]">
      <div className="relative overflow-hidden border-b border-border bg-muted/35 p-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <motion.div
          animate={{ opacity: [0.18, 0.34, 0.18], scale: [0.92, 1.08, 0.92] }}
          className="absolute right-6 top-5 h-24 w-24 rounded-full bg-primary/20 blur-2xl"
          transition={{ duration: 2.4, repeat: Infinity }}
        />
        <div className="relative flex items-center gap-3">
          <div className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <motion.span
              animate={{ opacity: [0.45, 1, 0.45], scale: [0.92, 1.08, 0.92] }}
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <motion.span
              animate={{ rotate: 360 }}
              className="absolute inset-[-5px] rounded-full border border-primary/40 border-t-primary"
              transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
            />
            <Sparkles className="relative z-10" size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black">Enhancing for ATS</p>
            <p className="text-sm font-medium text-muted-foreground">{enhancementStages[currentStage]}</p>
            <p className="mt-1 text-xs font-bold text-primary">{modelStatus}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {keywords.map((keyword, index) => (
                <motion.span
                  animate={{ opacity: [0.55, 1, 0.55], y: [0, -1, 0] }}
                  className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
                  key={keyword}
                  transition={{ delay: index * 0.18, duration: 1.4, repeat: Infinity }}
                >
                  {keyword}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_150px]">
        <div className="space-y-3">
        {enhancementStages.map((stage, index) => {
          const complete = index < currentStage;
          const active = index === currentStage;

          return (
            <div className="grid grid-cols-[28px_1fr] items-center gap-3" key={stage}>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  complete
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "relative border-transparent text-primary before:absolute before:inset-0 before:rounded-full before:border-2 before:border-primary before:border-t-transparent before:content-[''] before:animate-spin"
                      : "border-border text-muted-foreground"
                }`}
              >
                <span className="relative z-10">{complete ? <Check size={14} /> : index + 1}</span>
              </span>
              <div>
                <p className={`text-sm font-bold ${active ? "text-foreground" : complete ? "text-foreground" : "text-muted-foreground"}`}>
                  {stage}
                </p>
                {active && (
                  <div className="mt-2 max-w-48">
                    <SeamlessProgress />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>

        <div className="relative hidden overflow-hidden rounded-md border border-border bg-muted/30 p-3 md:block">
          <SeamlessScan />
          <p className="relative text-xs font-black uppercase text-muted-foreground">Resume scan</p>
          <div className="relative mt-3 space-y-2">
            {[72, 88, 54, 96, 66].map((width, index) => (
              <div className="h-2 overflow-hidden rounded-full bg-surface" key={width}>
                <motion.div
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${width}%` }}
                  transition={{ delay: index * 0.16, duration: 1.25, repeat: Infinity }}
                />
              </div>
            ))}
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-primary/10 border-r-primary/30"
            transition={{ duration: 3.2, ease: "linear", repeat: Infinity }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            className="absolute -bottom-14 -left-12 h-32 w-32 rounded-full border border-primary/10 border-l-primary/25"
            transition={{ duration: 4.5, ease: "linear", repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
}

function SeamlessProgress({ duration = 1.2, heightClass = "h-1.5" }: { duration?: number; heightClass?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-full bg-muted ${heightClass}`}>
      <motion.div
        animate={{ x: ["-50%", "0%"] }}
        className="absolute inset-y-0 left-0 w-[200%]"
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent 0%, transparent 10%, hsl(var(--primary) / 0.9) 10%, hsl(var(--primary) / 0.9) 24%, transparent 24%, transparent 50%)"
        }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}

function SeamlessScan() {
  return (
    <motion.div
      animate={{ y: ["-50%", "0%"] }}
      className="pointer-events-none absolute left-0 top-0 h-[200%] w-full"
      style={{
        background:
          "repeating-linear-gradient(180deg, transparent 0%, transparent 15%, hsl(var(--primary) / 0.18) 22%, hsl(var(--primary) / 0.08) 32%, transparent 39%, transparent 50%)"
      }}
      transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
    />
  );
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

function waitForStage() {
  return new Promise((resolve) => setTimeout(resolve, minimumEnhancementStageMs));
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

function Panel({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-4">
        <button
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          type="button"
          onClick={() => setCollapsed((value) => !value)}
        >
          <h2 className="min-w-0 truncate font-semibold">{title}</h2>
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : "rotate-0"}`} />
        </button>
        {actions}
      </div>
      {!collapsed && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}

function CollectionItem({ title, children, onRemove }: { title: string; children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-3 py-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <button
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          type="button"
          title={`Remove ${title}`}
          onClick={onRemove}
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function SectionVisibilityToggle({ hidden, sectionName, onToggle }: { hidden: boolean; sectionName: string; onToggle: () => void }) {
  return (
    <button
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border transition ${hidden ? "border-amber-300 bg-amber-50 text-amber-700" : "border-border text-muted-foreground hover:bg-muted"}`}
      type="button"
      title={`${hidden ? "Show" : "Hide"} ${sectionName} section`}
      onClick={onToggle}
    >
      {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function ScoreTypePicker({ value, onChange }: { value: "cgpa" | "percentage"; onChange: (value: "cgpa" | "percentage") => void }) {
  return (
    <div className="grid grid-cols-2 rounded-md border border-border bg-muted/40 p-1">
      {(["cgpa", "percentage"] as const).map((item) => (
        <button
          className={`h-8 rounded text-xs font-black uppercase transition ${value === item ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}
          key={item}
          type="button"
          onClick={() => onChange(item)}
        >
          {item === "cgpa" ? "CGPA" : "%"}
        </button>
      ))}
    </div>
  );
}

function Collection<T>({ title, children, onAdd, addLabel, actions }: { title: string; items: T[]; children: React.ReactNode; onAdd: () => void; addLabel: string; actions?: React.ReactNode }) {
  return (
    <Panel title={title} actions={actions}>
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

function isEducationScoreInvalid(item: ResumeData["education"][number]) {
  const value = item.cgpa.trim();
  if (!value) return false;
  const score = Number(value.replace(/%$/, ""));
  if (!Number.isFinite(score)) return true;
  return (item.scoreType ?? "cgpa") === "percentage"
    ? score < 1 || score > 100
    : score < 1 || score > 10;
}

function AiPolishNudgeContent({ action }: { action: FinalizeAction | null }) {
  const actionLabel = action === "download" ? "generating the PDF" : "saving";

  return (
    <div className="space-y-3">
      <p>
        Before {actionLabel}, AI can improve wording, grammar, and impact while keeping your original details.
      </p>
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
        You can review the changes, undo them, or continue without AI.
      </div>
    </div>
  );
}

function getEnhanceConfirmDescription({
  enabled,
  jobRequirement,
  onEnabledChange,
  onJobRequirementChange,
  usage
}: {
  enabled: boolean;
  jobRequirement: string;
  onEnabledChange: (value: boolean) => void;
  onJobRequirementChange: (value: string) => void;
  usage?: AiEnhanceUsage;
}) {
  if (!usage) {
    return (
      <EnhanceConfirmContent
        enabled={enabled}
        jobRequirement={jobRequirement}
        onEnabledChange={onEnabledChange}
        onJobRequirementChange={onJobRequirementChange}
        remainingLabel="AI enhancement available"
      />
    );
  }

  return (
    <EnhanceConfirmContent
      enabled={enabled}
      jobRequirement={jobRequirement}
      onEnabledChange={onEnabledChange}
      onJobRequirementChange={onJobRequirementChange}
      remainingLabel={usage.remaining === null ? "AI enhancement: Unlimited" : `AI enhancements left today: ${usage.remaining}`}
      usesChance={usage.remaining !== null}
    />
  );
}

function EnhanceConfirmContent({
  enabled,
  jobRequirement,
  onEnabledChange,
  onJobRequirementChange,
  remainingLabel,
  usesChance = false
}: {
  enabled: boolean;
  jobRequirement: string;
  onEnabledChange: (value: boolean) => void;
  onJobRequirementChange: (value: string) => void;
  remainingLabel: string;
  usesChance?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold text-foreground">{remainingLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {usesChance ? "This will use 1 chance and replace your editable resume content." : "This will replace your editable resume content."}
        </p>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
        Fill all sections first for the best result.
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <button
          className="flex w-full items-center justify-between gap-3 text-left"
          type="button"
          onClick={() => onEnabledChange(!enabled)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${enabled ? "bg-primary text-primary-foreground" : "bg-surface text-primary"}`}>
              <Target size={17} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">Target a job post</span>
              <span className="block text-xs text-muted-foreground">Optional: paste Naukri/LinkedIn JD for sharper ATS keywords.</span>
            </span>
          </span>
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} />
          </span>
        </button>
        {enabled && (
          <div className="mt-3 space-y-2">
            <Textarea
              className="min-h-28"
              maxLength={2000}
              placeholder="Paste job responsibilities, required skills, role description, or recruiter requirements here..."
              value={jobRequirement}
              onChange={(event) => onJobRequirementChange(event.target.value)}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>AI will tailor only where your resume already supports it.</span>
              <span>{jobRequirement.length}/2000</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AiDiffModal({
  history,
  open,
  onClose
}: {
  history: NonNullable<AiEnhanceHistory>;
  open: boolean;
  onClose: () => void;
}) {
  const groups = buildResumeDiffGroups(history.before, history.after);
  if (!open) return null;

  return (
    <div
      aria-labelledby="ai-diff-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-3 py-5 backdrop-blur-sm"
      role="dialog"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-surface text-surface-foreground shadow-soft"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
              <FileDiff size={14} /> AI Enhancements
            </p>
            <h2 className="mt-2 text-lg font-black" id="ai-diff-title">Resume preview after AI enhancement</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Red was removed. Green was added. You can close this and reopen it anytime from the AI controls.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${history.state === "applied" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {history.state === "applied" ? "AI enhancement applied" : "AI enhancement undone"}
            </span>
            <button
              aria-label="Close "
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted"
              type="button"
              onClick={onClose}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/35 p-3 sm:p-5">
          {groups.length === 0 ? (
            <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border text-center">
              <div>
                <Sparkles className="mx-auto text-primary" size={30} />
                <p className="mt-3 font-black">No text changes found</p>
                <p className="mt-1 text-sm text-muted-foreground">The AI response matched your existing editable content.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="overflow-hidden rounded-lg border border-border bg-slate-100 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
                  <span className="text-xs font-black uppercase text-red-600">Before enhancement</span>
                  <span className="text-xs text-muted-foreground">Removed text is red</span>
                </div>
                <div className="overflow-auto p-4">
                  <ResumePreview data={history.before} zoom={0.62} compact appearance="light" fitContent diff={{ side: "before", otherData: history.after }} />
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-slate-100 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
                  <span className="text-xs font-black uppercase text-emerald-600">After enhancement</span>
                  <span className="text-xs text-muted-foreground">Added text is green</span>
                </div>
                <div className="overflow-auto p-4">
                  <ResumePreview data={history.after} zoom={0.62} compact appearance="light" fitContent diff={{ side: "after", otherData: history.before }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border p-4">
          <Button type="button" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}

type DiffRow = {
  type: "same" | "removed" | "added";
  before?: string;
  after?: string;
};

type DiffGroup = {
  title: string;
  rows: DiffRow[];
};

function buildResumeDiffGroups(before: ResumeData, after: ResumeData): DiffGroup[] {
  const beforeSections = resumeTextSections(before);
  const afterSections = resumeTextSections(after);

  return beforeSections.flatMap((section, index) => {
    const afterSection = afterSections[index];
    if (!afterSection || section.lines.join("\n") === afterSection.lines.join("\n")) return [];

    return [{
      title: section.title,
      rows: diffLines(section.lines, afterSection.lines)
    }];
  });
}

function resumeTextSections(data: ResumeData) {
  return [
    { title: "Summary", lines: cleanLines([data.summary]) },
    { title: "Skills", lines: cleanLines(data.skills.map((skill) => `- ${skill}`)) },
    {
      title: "Experience",
      lines: cleanLines(data.experience.flatMap((item) => [
        `${item.role}${item.company ? ` at ${item.company}` : ""}`,
        item.description
      ]))
    },
    {
      title: "Projects",
      lines: cleanLines(data.projects.flatMap((item) => [
        item.name,
        item.technologies ? `Tech: ${item.technologies}` : "",
        item.description
      ]))
    },
    {
      title: "Education",
      lines: cleanLines(data.education.flatMap((item) => [
        `${item.degree}${item.college ? `, ${item.college}` : ""}`,
        item.cgpa ? `${item.scoreType === "percentage" ? "Percentage" : "CGPA"}: ${item.cgpa}` : "",
        item.description
      ]))
    },
    {
      title: "Certifications",
      lines: cleanLines(data.certifications.flatMap((item) => [
        `${item.name}${item.provider ? `, ${item.provider}` : ""}`,
        item.description
      ]))
    },
    {
      title: "Achievements",
      lines: cleanLines(data.achievements.flatMap((item) => [
        item.title,
        item.description
      ]))
    }
  ];
}

function cleanLines(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean);
}

function diffLines(before: string[], after: string[]): DiffRow[] {
  const table = Array.from({ length: before.length + 1 }, () => Array(after.length + 1).fill(0) as number[]);

  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      table[i][j] = before[i] === after[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;

  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      rows.push({ type: "same", before: before[i], after: after[j] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ type: "removed", before: before[i] });
      i += 1;
    } else {
      rows.push({ type: "added", after: after[j] });
      j += 1;
    }
  }

  while (i < before.length) {
    rows.push({ type: "removed", before: before[i] });
    i += 1;
  }
  while (j < after.length) {
    rows.push({ type: "added", after: after[j] });
    j += 1;
  }

  return rows;
}

function EnhanceErrorContent({ message }: { message: string | null }) {
  return (
    <div className="space-y-3">
      <p>Our AI model could not enhance the resume right now.</p>
      {message && (
        <div className="break-words rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
          {message}
        </div>
      )}
      <p>You can retry in a moment, or cancel and keep editing your resume.</p>
    </div>
  );
}

function DailyLimitContent() {
  return (
    <div className="mt-3 space-y-4">
      <div className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50 text-amber-950">
        <div className="relative flex items-center gap-3 px-4 py-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white shadow-sm">
            <Sparkles className="animate-bounce text-amber-500" size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-950">AI recharge in progress</p>
            <p className="text-sm text-amber-800">Your daily enhance pack refills tomorrow.</p>
          </div>
        </div>
        <div className="h-2 overflow-hidden bg-amber-100">
          <div className="h-full w-1/3 animate-pulse rounded-r-full bg-amber-500" />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-foreground">
        <CalendarClock className="shrink-0 text-primary" size={17} />
        <span className="text-sm font-medium">Come back tomorrow, or ask an admin to reset today&apos;s AI count.</span>
      </div>
    </div>
  );
}
