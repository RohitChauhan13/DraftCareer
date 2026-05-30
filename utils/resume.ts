import type { ResumeData } from "@/types/resume";

const resumeSectionKeys = ["summary", "skills", "experience", "projects", "education", "certifications", "achievements"] as const;

export const emptyResumeData: ResumeData = {
  title: "Untitled Resume",
    templateId: "modern",
    themeId: "red",
  themeColor: undefined,
  textColors: {},
  hiddenSections: [],
  initialsStyle: {},
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
  const { originalImage, ...persistedInitialsStyle } = data.initialsStyle;

  return Object.entries({
    personal: data.personal,
    metadata: { themeId: data.themeId, themeColor: data.themeColor, textColors: data.textColors, hiddenSections: data.hiddenSections ?? [], initialsStyle: persistedInitialsStyle },
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
    themeColor: normalizeThemeColor(byType.get("metadata")),
    textColors: normalizeTextColors(byType.get("metadata")),
    hiddenSections: normalizeHiddenSections(byType.get("metadata")),
    initialsStyle: normalizeInitialsStyle(byType.get("metadata")),
    personal: { ...emptyResumeData.personal, ...(byType.get("personal") as object | undefined) },
    summary: typeof byType.get("summary") === "string" ? (byType.get("summary") as string) : "",
    skills: Array.isArray(byType.get("skills")) ? (byType.get("skills") as string[]) : [],
    education: normalizeEducation(byType.get("education")),
    experience: normalizeExperience(byType.get("experience")),
    projects: Array.isArray(byType.get("projects")) ? (byType.get("projects") as ResumeData["projects"]) : [],
    certifications: normalizeCertifications(byType.get("certifications")),
    achievements: normalizeAchievements(byType.get("achievements"))
  };
}

function normalizeInitialsStyle(value: unknown): ResumeData["initialsStyle"] {
  const style = value && typeof value === "object" && "initialsStyle" in value
    ? (value as { initialsStyle?: unknown }).initialsStyle
    : undefined;
  if (!style || typeof style !== "object") return {};

  const input = style as Record<string, unknown>;
  const output: ResumeData["initialsStyle"] = {};
  if (typeof input.hidden === "boolean") {
    output.hidden = input.hidden;
  }
  if (typeof input.letterColor === "string" && /^#[0-9a-f]{6}$/i.test(input.letterColor)) {
    output.letterColor = input.letterColor;
  }
  if (typeof input.boxColor === "string" && /^#[0-9a-f]{6}$/i.test(input.boxColor)) {
    output.boxColor = input.boxColor;
  }
  if (input.shape === "round" || input.shape === "square") {
    output.shape = input.shape;
  }
  if (input.position === "left" || input.position === "center" || input.position === "right") {
    output.position = input.position;
  }
  if (typeof input.image === "string" && /^data:image\/(png|jpe?g|webp);base64,/i.test(input.image)) {
    output.image = input.image;
  }
  if (typeof input.scale === "number" && Number.isFinite(input.scale)) {
    output.scale = Math.min(2.5, Math.max(1, input.scale));
  }
  return output;
}

function normalizeThemeId(value: unknown): ResumeData["themeId"] {
  const themeId = value && typeof value === "object" && "themeId" in value
    ? (value as { themeId?: unknown }).themeId
    : undefined;

  return typeof themeId === "string" && ["purple", "charcoal", "taupe", "navy", "blue", "teal", "green", "orange", "red"].includes(themeId)
    ? (themeId as ResumeData["themeId"])
    : "red";
}

function normalizeThemeColor(value: unknown): ResumeData["themeColor"] {
  const themeColor = value && typeof value === "object" && "themeColor" in value
    ? (value as { themeColor?: unknown }).themeColor
    : undefined;

  return typeof themeColor === "string" && /^#[0-9a-f]{6}$/i.test(themeColor)
    ? themeColor
    : undefined;
}

function normalizeTextColors(value: unknown): ResumeData["textColors"] {
  const colors = value && typeof value === "object" && "textColors" in value
    ? (value as { textColors?: unknown }).textColors
    : undefined;
  if (!colors || typeof colors !== "object") return {};

  const output: ResumeData["textColors"] = {};
  for (const key of ["name", "description", "subtitle", "meta", "background"] as const) {
    const color = (colors as Record<string, unknown>)[key];
    if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)) {
      output[key] = color;
    }
  }
  return output;
}

function normalizeHiddenSections(value: unknown): ResumeData["hiddenSections"] {
  const hiddenSections = value && typeof value === "object" && "hiddenSections" in value
    ? (value as { hiddenSections?: unknown }).hiddenSections
    : undefined;
  if (!Array.isArray(hiddenSections)) return [];

  return hiddenSections.filter((section): section is NonNullable<ResumeData["hiddenSections"]>[number] => (
    typeof section === "string" && resumeSectionKeys.includes(section as typeof resumeSectionKeys[number])
  ));
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

function normalizeEducation(value: unknown): ResumeData["education"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const education = item && typeof item === "object" ? item as Record<string, unknown> : {};

      return {
        college: typeof education.college === "string" ? education.college : "",
        degree: typeof education.degree === "string" ? education.degree : "",
        cgpa: typeof education.cgpa === "string" ? education.cgpa : "",
        startDate: typeof education.startDate === "string" ? education.startDate : "",
        endDate: typeof education.endDate === "string" ? education.endDate : "",
        description: typeof education.description === "string" ? education.description : ""
      };
    })
    .filter((item) => item.college || item.degree || item.cgpa || item.startDate || item.endDate || item.description);
}

function normalizeCertifications(value: unknown): ResumeData["certifications"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const certification = item && typeof item === "object" ? item as Record<string, unknown> : {};

      return {
        name: typeof certification.name === "string" ? certification.name : "",
        provider: typeof certification.provider === "string" ? certification.provider : "",
        date: typeof certification.date === "string" ? certification.date : "",
        description: typeof certification.description === "string" ? certification.description : ""
      };
    })
    .filter((item) => item.name || item.provider || item.date || item.description);
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
