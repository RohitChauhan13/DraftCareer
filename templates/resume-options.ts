import type { TemplateId, ThemeId } from "@/types/resume";

export const resumeThemes: { id: ThemeId; label: string; color: string; text: string }[] = [
  { id: "white", label: "White", color: "#ffffff", text: "#111827" },
  { id: "charcoal", label: "Charcoal", color: "#30363d", text: "#ffffff" },
  { id: "taupe", label: "Taupe", color: "#ad9c94", text: "#ffffff" },
  { id: "navy", label: "Navy", color: "#16427f", text: "#ffffff" },
  { id: "blue", label: "Blue", color: "#4387d9", text: "#ffffff" },
  { id: "teal", label: "Teal", color: "#00a6b8", text: "#ffffff" },
  { id: "green", label: "Green", color: "#2e8a73", text: "#ffffff" },
  { id: "orange", label: "Orange", color: "#ff9418", text: "#ffffff" },
  { id: "red", label: "Red", color: "#d14550", text: "#ffffff" }
];

export const resumeTemplates: { id: TemplateId; label: string; popular?: boolean }[] = [
  { id: "modern", label: "Bold Header" },
  { id: "ats", label: "ATS Classic", popular: true },
  { id: "minimal", label: "Minimal Lines" },
  { id: "developer", label: "Sidebar Pro", popular: true },
  { id: "classic", label: "Centered Classic" },
  { id: "executive", label: "Executive Split" },
  { id: "timeline", label: "Timeline" },
  { id: "compact", label: "Compact Pro", popular: true },
  { id: "editorial", label: "Editorial" },
  { id: "accent", label: "Accent Rail" },
  { id: "split", label: "Two Column" },
  { id: "mono", label: "Mono Tech" }
];

export function getTheme(themeId: ThemeId) {
  return resumeThemes.find((theme) => theme.id === themeId) ?? resumeThemes[resumeThemes.length - 1];
}
