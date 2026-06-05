import type { ResumeData } from "@/types/resume";
import { resumeDataSchema } from "@/lib/validations";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};
type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};
type AiModelSlot =
  | { provider: "gemini"; model: string }
  | { provider: "openrouter"; model: string };

const defaultModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
const defaultOpenRouterModels = ["openrouter/auto"];

export async function enhanceResumeWithGemini(resume: ResumeData, jobRequirement?: string): Promise<ResumeData> {
  const models = getAiModelSlots();
  if (models.length === 0) throw new Error("No AI provider is configured.");
  let lastError: Error | null = null;

  for (const slot of models) {
    try {
      return await enhanceResumeWithModelSlot({ slot, resume, jobRequirement });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Gemini enhancement failed.");
      if (!isRetryableGeminiError(lastError)) break;
    }
  }

  if (lastError && isRetryableGeminiError(lastError)) {
    throw new Error("All AI models are currently busy or out of available quota. Please try again later.");
  }
  throw lastError ?? new Error("Gemini enhancement failed.");
}

export async function enhanceResumeWithGeminiModelIndex(resume: ResumeData, modelIndex: number, jobRequirement?: string): Promise<ResumeData> {
  const slot = getAiModelSlots()[modelIndex];
  if (!slot) {
    throw new Error("No AI model is configured for this fallback slot.");
  }

  return enhanceResumeWithModelSlot({ slot, resume, jobRequirement });
}

export function getGeminiModelCount() {
  return getAiModelSlots().length;
}

async function enhanceResumeWithModelSlot({
  slot,
  resume,
  jobRequirement
}: {
  slot: AiModelSlot;
  resume: ResumeData;
  jobRequirement?: string;
}) {
  if (slot.provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    return enhanceResumeWithModel({ apiKey, model: slot.model, resume, jobRequirement });
  }

  const apiKey = getOpenRouterApiKey();
  if (!apiKey) throw new Error("OPEN_ROUTER_API_KEY is not configured.");
  return enhanceResumeWithOpenRouterModel({ apiKey, model: slot.model, resume, jobRequirement });
}

async function enhanceResumeWithModel({
  apiKey,
  model,
  resume,
  jobRequirement
}: {
  apiKey: string;
  model: string;
  resume: ResumeData;
  jobRequirement?: string;
}) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(resume, jobRequirement) }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    })
  });

  const payload = await response.json() as GeminiResponse;
  if (!response.ok) {
    throw new GeminiApiError(payload.error?.message ?? "Gemini enhancement failed.", response.status, model);
  }

  const text = payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Gemini did not return enhanced resume data.");
  }

  const repaired = resumeDataSchema.parse(repairEnhancedResume(resume, parseAiJson(text)));
  if (!hasEditableTextChanges(resume, repaired)) throw new AiNoChangeError();
  return repaired;
}

async function enhanceResumeWithOpenRouterModel({
  apiKey,
  model,
  resume,
  jobRequirement
}: {
  apiKey: string;
  model: string;
  resume: ResumeData;
  jobRequirement?: string;
}) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
      ...(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL ? { "http-referer": process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "" } : {}),
      "x-title": "DraftCareer"
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
      max_tokens: 8192,
      response_format: { type: "json_object" }
    })
  });

  const payload = await response.json() as OpenRouterResponse;
  if (!response.ok) {
    throw new OpenRouterApiError(payload.error?.message ?? "OpenRouter enhancement failed.", response.status, model);
  }

  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("AI did not return enhanced resume data.");
  }

  const repaired = resumeDataSchema.parse(repairEnhancedResume(resume, parseAiJson(text)));
  if (!hasEditableTextChanges(resume, repaired)) throw new AiNoChangeError();
  return repaired;
}

function getGeminiModels() {
  const configuredModels = process.env.GEMINI_MODELS;
  const configuredModel = process.env.GEMINI_MODEL;
  const models = configuredModels
    ? configuredModels.split(",").map((item) => item.trim()).filter(Boolean)
    : configuredModel
      ? [configuredModel.trim(), ...defaultModels].filter(Boolean)
      : defaultModels;

  return Array.from(new Set(models.length > 0 ? models : defaultModels));
}

function getOpenRouterModels() {
  if (!getOpenRouterApiKey()) return [];

  const configuredModels = process.env.OPEN_ROUTER_MODELS ?? process.env.OPENROUTER_MODELS;
  const models = configuredModels
    ? configuredModels.split(",").map((item) => item.trim()).filter(Boolean)
    : defaultOpenRouterModels;

  return Array.from(new Set(models.length > 0 ? models : defaultOpenRouterModels));
}

function getAiModelSlots(): AiModelSlot[] {
  return [
    ...getOpenRouterModels().map((model): AiModelSlot => ({ provider: "openrouter", model })),
    ...(process.env.GEMINI_API_KEY ? getGeminiModels().map((model): AiModelSlot => ({ provider: "gemini", model })) : [])
  ];
}

function getOpenRouterApiKey() {
  return process.env.OPEN_ROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY;
}

export function isRetryableGeminiError(error: Error) {
  if (error instanceof GeminiApiError || error instanceof OpenRouterApiError) {
    return error.status === 429 || error.status >= 500 || /high demand|overloaded|temporar|quota|rate/i.test(error.message);
  }

  return error instanceof AiResponseParseError || error instanceof AiNoChangeError || /fetch failed|network|timeout|high demand|overloaded|temporar|quota|rate/i.test(error.message);
}

class GeminiApiError extends Error {
  constructor(message: string, public status: number, public model: string) {
    super(message);
    this.name = "GeminiApiError";
  }
}

class OpenRouterApiError extends Error {
  constructor(message: string, public status: number, public model: string) {
    super(message);
    this.name = "OpenRouterApiError";
  }
}

class AiResponseParseError extends Error {
  constructor() {
    super("AI returned incomplete response data. Trying another model.");
    this.name = "AiResponseParseError";
  }
}

class AiNoChangeError extends Error {
  constructor() {
    super("AI did not produce meaningful text changes. Trying another model.");
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
    "Rewrite the supplied resume data to be ATS-friendly, concise, truthful, and impact-focused.",
    jobRequirement ? "Tailor the resume toward the supplied job requirement while staying truthful to the candidate's existing data." : "Use broad ATS best practices because no target job requirement was supplied.",
    "Return only valid JSON matching the same object shape. Do not wrap it in markdown.",
    "Rules:",
    "- Preserve title, templateId, themeId, themeColor, textColors, hiddenSections, initialsStyle, dates, company names, school names, and certification names.",
    "- Personal contact fields are intentionally omitted and restored by the system later. Do not modify, infer, or mention them.",
    "- Improve summary and descriptions using strong action verbs, measurable impact when already implied, and role-relevant keywords.",
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
    personal: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: ""
    },
    initialsStyle: {
      ...resume.initialsStyle,
      image: resume.initialsStyle.image ? "[image omitted]" : undefined,
      originalImage: undefined
    }
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
