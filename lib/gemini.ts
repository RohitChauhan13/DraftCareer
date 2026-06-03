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

const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export async function enhanceResumeWithGemini(resume: ResumeData): Promise<ResumeData> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

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
          parts: [{ text: buildPrompt(resume) }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json"
      }
    })
  });

  const payload = await response.json() as GeminiResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Gemini enhancement failed.");
  }

  const text = payload.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Gemini did not return enhanced resume data.");
  }

  const parsed = resumeDataSchema.parse(JSON.parse(text));
  return restoreProtectedFields(resume, parsed);
}

function buildPrompt(resume: ResumeData) {
  return [
    "You are an expert ATS resume editor.",
    "Rewrite the supplied resume data to be ATS-friendly, concise, truthful, and impact-focused.",
    "Return only valid JSON matching the same object shape. Do not wrap it in markdown.",
    "Rules:",
    "- Preserve title, templateId, themeId, themeColor, textColors, hiddenSections, initialsStyle, all personal contact fields, dates, links, company names, school names, and certification names.",
    "- Improve summary and descriptions using strong action verbs, measurable impact when already implied, and role-relevant keywords.",
    "- Do not invent employers, degrees, dates, metrics, credentials, links, or tools that are not supported by the input.",
    "- Keep summary under 600 characters.",
    "- Keep descriptions readable in resume format; prefer 1-3 tight bullet-style sentences per item.",
    "- Deduplicate and normalize skills. You may add skills only when clearly evidenced by projects or experience.",
    "",
    JSON.stringify(stripLargeClientOnlyFields(resume))
  ].join("\n");
}

function stripLargeClientOnlyFields(resume: ResumeData): ResumeData {
  return {
    ...resume,
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
