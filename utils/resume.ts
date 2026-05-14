import type { ResumeData } from "@/types/resume";

export const emptyResumeData: ResumeData = {
  title: "Untitled Resume",
  templateId: "modern",
  themeId: "red",
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: ""
  },
  summary: "",
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  achievements: []
};

export function sectionsFromResumeData(data: ResumeData) {
  return Object.entries({
    personal: data.personal,
    metadata: { themeId: data.themeId },
    summary: data.summary,
    skills: data.skills,
    education: data.education,
    experience: data.experience,
    projects: data.projects,
    certifications: data.certifications,
    achievements: data.achievements
  }).map(([sectionType, contentJson]) => ({ sectionType, contentJson }));
}

export function resumeDataFromSections(input: {
  title: string;
  templateId: string;
  sections: { sectionType: string; contentJson: unknown }[];
}): ResumeData {
  const byType = new Map(input.sections.map((section) => [section.sectionType, section.contentJson]));

  return {
    ...emptyResumeData,
    title: input.title,
    templateId: ["modern", "ats", "minimal", "developer", "classic", "executive", "timeline", "compact", "editorial", "accent", "split", "mono"].includes(input.templateId)
      ? (input.templateId as ResumeData["templateId"])
      : "modern",
    themeId: normalizeThemeId(byType.get("metadata")),
    personal: { ...emptyResumeData.personal, ...(byType.get("personal") as object | undefined) },
    summary: typeof byType.get("summary") === "string" ? (byType.get("summary") as string) : "",
    skills: Array.isArray(byType.get("skills")) ? (byType.get("skills") as string[]) : [],
    education: Array.isArray(byType.get("education")) ? (byType.get("education") as ResumeData["education"]) : [],
    experience: normalizeExperience(byType.get("experience")),
    projects: Array.isArray(byType.get("projects")) ? (byType.get("projects") as ResumeData["projects"]) : [],
    certifications: Array.isArray(byType.get("certifications"))
      ? (byType.get("certifications") as ResumeData["certifications"])
      : [],
    achievements: normalizeAchievements(byType.get("achievements"))
  };
}

function normalizeThemeId(value: unknown): ResumeData["themeId"] {
  const themeId = value && typeof value === "object" && "themeId" in value
    ? (value as { themeId?: unknown }).themeId
    : undefined;

  return typeof themeId === "string" && ["white", "charcoal", "taupe", "navy", "blue", "teal", "green", "orange", "red"].includes(themeId)
    ? (themeId as ResumeData["themeId"])
    : "red";
}

function normalizeExperience(value: unknown): ResumeData["experience"] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const experience = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const legacyDuration = typeof experience.duration === "string" ? experience.duration : "";

    return {
      company: typeof experience.company === "string" ? experience.company : "",
      role: typeof experience.role === "string" ? experience.role : "",
      startDate: typeof experience.startDate === "string" ? experience.startDate : legacyDuration,
      endDate: typeof experience.endDate === "string" ? experience.endDate : "",
      current: typeof experience.current === "boolean" ? experience.current : false,
      description: typeof experience.description === "string" ? experience.description : ""
    };
  });
}

function normalizeAchievements(value: unknown): ResumeData["achievements"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        return { title: item, description: "" };
      }
      if (item && typeof item === "object") {
        const achievement = item as Partial<ResumeData["achievements"][number]>;
        return {
          title: typeof achievement.title === "string" ? achievement.title : "",
          description: typeof achievement.description === "string" ? achievement.description : ""
        };
      }
      return { title: "", description: "" };
    })
    .filter((item) => item.title || item.description);
}
