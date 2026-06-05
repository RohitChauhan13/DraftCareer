import type { ResumeData } from "@/types/resume";
import { resumeDataSchema } from "@/lib/validations";

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const requestedOutputTokens = 2500;
const defaultGroqModels = [
  "qwen/qwen3-32b",
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "groq/compound-mini",
  "groq/compound"
];
const groqModelTokenLimits: Record<string, number> = {
  "qwen/qwen3-32b": 6000,
  "llama-3.1-8b-instant": 6000,
  "llama-3.3-70b-versatile": 12000,
  "meta-llama/llama-4-scout-17b-16e-instruct": 30000,
  "groq/compound-mini": 70000,
  "groq/compound": 70000
};

export async function enhanceResumeWithGroq(resume: ResumeData, jobRequirement?: string): Promise<ResumeData> {
  return enhanceResumeWithGroqModelIndex(resume, 0, jobRequirement);
}

export async function enhanceResumeWithGroqModelIndex(resume: ResumeData, modelIndex: number, jobRequirement?: string): Promise<ResumeData> {
  const model = getGroqModelsForRequest(resume, jobRequirement)[modelIndex];
  if (!model) {
    throw new Error("No AI model is configured for this fallback slot.");
  }

  return enhanceResumeWithGroqModel({ model, resume, jobRequirement });
}

export function getGroqModelCount() {
  return getGroqModels().length;
}

async function enhanceResumeWithGroqModel({
  model,
  resume,
  jobRequirement
}: {
  model: string;
  resume: ResumeData;
  jobRequirement?: string;
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: buildPrompt(resume, jobRequirement)
        }
      ],
      temperature: 0.35,
      max_tokens: requestedOutputTokens,
      response_format: { type: "json_object" }
    })
  });

  const payload = await response.json() as GroqResponse;
  if (!response.ok) {
    throw new GroqApiError(payload.error?.message ?? "Groq enhancement failed.", response.status, model);
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AiResponseParseError();
  }

  const repaired = resumeDataSchema.parse(repairEnhancedResume(resume, parseAiJson(text)));
  if (!hasEditableTextChanges(resume, repaired)) throw new AiNoChangeError();
  return repaired;
}

function getGroqModels() {
  const configuredModels = process.env.GROQ_MODELS;
  const models = configuredModels
    ? configuredModels.split(",").map((item) => item.trim()).filter(Boolean)
    : defaultGroqModels;

  return Array.from(new Set(models.length > 0 ? models : defaultGroqModels));
}

function getGroqModelsForRequest(resume: ResumeData, jobRequirement?: string) {
  const models = getGroqModels();
  const promptTokens = estimateTokens(buildPrompt(resume, jobRequirement));
  const requestedTokens = promptTokens + requestedOutputTokens;

  return [...models].sort((first, second) => {
    const firstFits = getGroqModelTokenLimit(first) >= requestedTokens;
    const secondFits = getGroqModelTokenLimit(second) >= requestedTokens;
    if (firstFits !== secondFits) return firstFits ? -1 : 1;
    return getGroqModelTokenLimit(first) - getGroqModelTokenLimit(second);
  });
}

function getGroqModelTokenLimit(model: string) {
  return groqModelTokenLimits[model] ?? 6000;
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function isRetryableGroqError(error: Error) {
  if (error instanceof GroqApiError) {
    return error.status === 429
      || error.status >= 500
      || /not found|does not exist|decommissioned|unsupported|not supported|incompatible|unavailable|high demand|overloaded|temporar|quota|rate/i.test(error.message);
  }

  return error instanceof AiResponseParseError
    || error instanceof AiNoChangeError
    || /fetch failed|network|timeout|not found|does not exist|decommissioned|unsupported|not supported|incompatible|unavailable|high demand|overloaded|temporar|quota|rate/i.test(error.message);
}

export function getGroqEnhanceErrorMessage(error: Error) {
  if (error.message.includes("GROQ_API_KEY")) {
    return "AI service is not configured. Please contact support.";
  }

  if (error instanceof GroqApiError) {
    if (error.status === 401 || error.status === 403) {
      return "AI service could not be authorized. Please contact support.";
    }
    if (error.status === 413 || /request too large|tokens per minute|tpm/i.test(error.message)) {
      return "This resume is too large for AI enhancement right now. Try shortening the job requirement or resume details.";
    }
    if (error.status === 429 || /quota|rate/i.test(error.message)) {
      return "AI enhancement is busy right now. Please try again after a short wait.";
    }
    if (/not found|does not exist|decommissioned|unsupported|not supported|incompatible|unavailable/i.test(error.message)) {
      return "An AI model is unavailable right now. Please try again in a moment.";
    }
    if (error.status >= 500 || /high demand|overloaded|temporar/i.test(error.message)) {
      return "AI enhancement is currently under heavy demand. Please try again in a moment.";
    }
    return "AI enhancement could not complete right now. Please try again later.";
  }

  if (error instanceof AiNoChangeError) {
    return "AI could not find useful wording improvements for this resume.";
  }

  if (error instanceof AiResponseParseError) {
    return "AI returned an incomplete response. Please try again.";
  }

  if (/fetch failed|network|timeout/i.test(error.message)) {
    return "Could not reach the AI service. Check the connection and try again.";
  }

  return "AI enhancement could not complete right now. Please try again later.";
}

class GroqApiError extends Error {
  constructor(message: string, public status: number, public model: string) {
    super(message);
    this.name = "GroqApiError";
  }
}

class AiResponseParseError extends Error {
  constructor() {
    super("AI returned incomplete response data. Please try again.");
    this.name = "AiResponseParseError";
  }
}

class AiNoChangeError extends Error {
  constructor() {
    super("AI did not produce meaningful text changes. Please try again.");
    this.name = "AiNoChangeError";
  }
}

function parseAiJson(text: string) {
  try {
    return JSON.parse(extractJsonObject(text));
  } catch {
    throw new AiResponseParseError();
  }
}

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AiResponseParseError();
  }

  return trimmed.slice(start, end + 1);
}

function buildPrompt(resume: ResumeData, jobRequirement?: string) {
  return [
    "You are an expert ATS resume editor.",
    "Rewrite the supplied resume JSON to be ATS-friendly, concise, truthful, recruiter-friendly, and impact-focused.",
    jobRequirement ? "Tailor the resume toward the supplied job requirement while staying truthful to the candidate's existing data." : "Use broad ATS best practices because no target job requirement was supplied.",
    "Return only valid JSON matching the same object shape. Do not wrap it in markdown.",
    "Rules:",
    "- Preserve title, templateId, themeId, themeColor, textColors, hiddenSections, initialsStyle, dates, company names, school names, certification names, scores, links, and contact fields.",
    "- Personal contact fields are intentionally omitted and restored by the system later. Do not modify, infer, or mention them.",
    "- Improve summary, skills, experience descriptions, project descriptions, project technologies, education descriptions, certification descriptions, and achievement descriptions.",
    "- Use strong action verbs, measurable impact when already implied, and role-relevant ATS keywords.",
    "- If any editable summary, skill, experience, project, education, certification, or achievement text exists, change at least one editable text field with a real wording improvement.",
    "- Do not return the same editable text unchanged unless every editable text field is empty.",
    "- When a job requirement is supplied, prioritize matching relevant keywords, responsibilities, and tools from that requirement only when supported by the resume input.",
    "- Do not invent employers, degrees, dates, metrics, credentials, links, or tools that are not supported by the input.",
    "- Keep summary under 600 characters.",
    "- Keep descriptions readable in resume format; prefer 1-3 tight bullet-style sentences per item.",
    "- Deduplicate and normalize skills. You may add skills only when clearly evidenced by projects or experience.",
    jobRequirement ? ["", "Target job requirement:", jobRequirement].join("\n") : "",
    "",
    JSON.stringify(stripLargeClientOnlyFields(resume))
  ].filter(Boolean).join("\n");
}

function stripLargeClientOnlyFields(resume: ResumeData): ResumeData {
  return {
    ...resume,
    textColors: {},
    hiddenSections: [],
    personal: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: ""
    },
    initialsStyle: {},
    summary: limitText(resume.summary, 600, ""),
    skills: resume.skills.slice(0, 40).map((skill) => limitText(skill, 80, "")),
    experience: resume.experience.slice(0, 12).map((item) => ({
      company: item.company,
      role: item.role,
      startDate: item.startDate,
      endDate: item.endDate,
      current: item.current,
      description: limitText(item.description, 1200, "")
    })),
    projects: resume.projects.slice(0, 12).map((item) => ({
      name: item.name,
      description: limitText(item.description, 1200, ""),
      technologies: limitText(item.technologies, 400, ""),
      github: item.github,
      live: item.live
    })),
    education: resume.education.slice(0, 10).map((item) => ({
      college: item.college,
      degree: item.degree,
      cgpa: item.cgpa,
      scoreType: item.scoreType,
      startDate: item.startDate,
      endDate: item.endDate,
      description: limitText(item.description, 800, "")
    })),
    certifications: resume.certifications.slice(0, 12).map((item) => ({
      name: item.name,
      provider: item.provider,
      date: item.date,
      description: limitText(item.description, 800, "")
    })),
    achievements: resume.achievements.slice(0, 12).map((item) => ({
      title: item.title,
      description: limitText(item.description, 800, "")
    }))
  };
}

function restoreProtectedFields(original: ResumeData, enhanced: ResumeData): ResumeData {
  return {
    ...enhanced,
    title: original.title,
    templateId: original.templateId,
    themeId: original.themeId,
    themeColor: original.themeColor,
    textColors: original.textColors,
    hiddenSections: original.hiddenSections,
    initialsStyle: original.initialsStyle,
    personal: original.personal
  };
}

function repairEnhancedResume(original: ResumeData, value: unknown): ResumeData {
  const enhanced = value && typeof value === "object" ? value as Partial<ResumeData> : {};

  return restoreProtectedFields(original, {
    ...original,
    summary: limitText(enhanced.summary, 600, original.summary),
    skills: normalizeSkills(enhanced.skills, original.skills),
    experience: original.experience.map((item, index) => ({
      ...item,
      description: limitText(enhanced.experience?.[index]?.description, 1200, item.description)
    })),
    projects: original.projects.map((item, index) => ({
      ...item,
      description: limitText(enhanced.projects?.[index]?.description, 1200, item.description),
      technologies: limitText(enhanced.projects?.[index]?.technologies, 400, item.technologies)
    })),
    education: original.education.map((item, index) => ({
      ...item,
      description: limitText(enhanced.education?.[index]?.description, 800, item.description)
    })),
    certifications: original.certifications.map((item, index) => ({
      ...item,
      description: limitText(enhanced.certifications?.[index]?.description, 800, item.description)
    })),
    achievements: original.achievements.map((item, index) => ({
      ...item,
      description: limitText(enhanced.achievements?.[index]?.description, 800, item.description)
    }))
  });
}

function normalizeSkills(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const skills = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 80));

  return Array.from(new Set(skills)).slice(0, 40);
}

function limitText(value: unknown, maxLength: number, fallback: string) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

function hasEditableTextChanges(before: ResumeData, after: ResumeData) {
  return JSON.stringify(editableTextSnapshot(before)) !== JSON.stringify(editableTextSnapshot(after));
}

function editableTextSnapshot(data: ResumeData) {
  return {
    summary: normalizeText(data.summary),
    skills: data.skills.map(normalizeText).filter(Boolean),
    experience: data.experience.map((item) => normalizeText(item.description)),
    projects: data.projects.map((item) => ({
      description: normalizeText(item.description),
      technologies: normalizeText(item.technologies)
    })),
    education: data.education.map((item) => normalizeText(item.description)),
    certifications: data.certifications.map((item) => normalizeText(item.description)),
    achievements: data.achievements.map((item) => normalizeText(item.description))
  };
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
