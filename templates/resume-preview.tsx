import type { ResumeData, TemplateId } from "@/types/resume";
import { cn } from "@/lib/utils";
import { getTheme } from "@/templates/resume-options";

const templateFonts: Record<TemplateId, string> = {
  modern: "font-sans",
  ats: "font-serif",
  minimal: "font-sans",
  developer: "font-mono",
  classic: "font-serif",
  executive: "font-sans",
  timeline: "font-sans",
  compact: "font-sans",
  editorial: "font-serif",
  accent: "font-sans",
  split: "font-sans",
  mono: "font-mono"
};

export function ResumePreview({ data, zoom = 1, compact = false }: { data: ResumeData; zoom?: number; compact?: boolean }) {
  const theme = getTheme(data.themeId);

  return (
    <article
      className={cn(
        "mx-auto min-h-[1056px] w-[816px] origin-top bg-white text-slate-900 transition",
        compact ? "" : "shadow-soft",
        templateFonts[data.templateId]
      )}
      style={{ transform: `scale(${zoom})`, marginBottom: `${(zoom - 1) * 1056}px` }}
    >
      {["developer", "split"].includes(data.templateId) ? <SidebarResume data={data} accent={theme.color} inverted={data.templateId === "split"} /> : <StandardResume data={data} accent={theme.color} />}
    </article>
  );
}

function StandardResume({ data, accent }: { data: ResumeData; accent: string }) {
  const personal = data.personal;

  if (data.templateId === "classic") {
    return (
      <div className="px-12 py-9 text-center">
        <h1 className="text-3xl font-bold uppercase tracking-normal" style={{ color: accent }}>{personal.fullName || "Your Name"}</h1>
        <ContactRow personal={personal} className="justify-center border-b border-t border-slate-200 py-2" />
        <ResumeSections data={data} accent={accent} centered />
      </div>
    );
  }

  if (data.templateId === "editorial") {
    return (
      <div className="px-14 py-12">
        <header className="mb-8 grid grid-cols-[1fr_170px] items-end gap-8">
          <h1 className="text-5xl font-semibold uppercase leading-none tracking-normal">{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} className="justify-end text-right" />
        </header>
        <div className="h-3 w-40" style={{ backgroundColor: accent }} />
        <ResumeSections data={data} accent={accent} airy />
      </div>
    );
  }

  if (data.templateId === "minimal") {
    return (
      <div className="px-14 py-10">
        <h1 className="border-b border-slate-300 pb-2 text-4xl font-semibold uppercase tracking-normal">{personal.fullName || "Your Name"}</h1>
        <ContactRow personal={personal} className="py-2" />
        <ResumeSections data={data} accent={accent} leftMeta />
      </div>
    );
  }

  if (data.templateId === "compact") {
    return (
      <div className="px-10 py-8">
        <header className="border-b-4 pb-3" style={{ borderColor: accent }}>
          <h1 className="text-3xl font-bold uppercase tracking-normal">{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} className="mt-1" />
        </header>
        <ResumeSections data={data} accent={accent} compact />
      </div>
    );
  }

  if (data.templateId === "ats") {
    return (
      <div className="px-12 py-9">
        <header className="border-b border-slate-300 pb-3 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-normal">{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} className="justify-center" />
        </header>
        <ResumeSections data={data} accent={accent} boxed />
      </div>
    );
  }

  if (data.templateId === "timeline") {
    return (
      <div className="px-12 py-9">
        <header className="mb-5 border-l-[10px] py-2 pl-5" style={{ borderColor: accent }}>
          <h1 className="text-3xl font-bold uppercase tracking-normal">{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} className="mt-1" />
        </header>
        <ResumeSections data={data} accent={accent} timeline />
      </div>
    );
  }

  if (data.templateId === "accent") {
    return (
      <div className="relative min-h-[1056px] px-14 py-10">
        <div className="absolute bottom-0 left-0 top-0 w-5" style={{ backgroundColor: accent }} />
        <header className="mb-4">
          <h1 className="text-4xl font-bold uppercase tracking-normal" style={{ color: accent }}>{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} className="mt-2" />
        </header>
        <ResumeSections data={data} accent={accent} />
      </div>
    );
  }

  if (data.templateId === "mono") {
    return (
      <div className="px-12 py-9">
        <header className="bg-slate-950 p-7 text-white">
          <p className="mb-2 text-xs uppercase" style={{ color: accent }}>Resume</p>
          <h1 className="text-3xl font-bold uppercase tracking-normal">{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} className="mt-3 text-white/80" />
        </header>
        <ResumeSections data={data} accent={accent} boxed />
      </div>
    );
  }

  if (data.templateId === "executive") {
    return (
      <>
        <header className="px-12 py-8 text-white" style={{ backgroundColor: accent }}>
          <h1 className="text-4xl font-semibold uppercase leading-tight tracking-normal">{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} className="mt-3 border-t border-white/25 pt-3 text-white/90" />
        </header>
        <div className="px-12 py-8">
          <ResumeSections data={data} accent={accent} labelColumn />
        </div>
      </>
    );
  }

  return (
    <>
      <header>
        <div className="grid grid-cols-[92px_1fr] items-center gap-5 px-10 py-7 text-white" style={{ backgroundColor: accent }}>
          <div className="flex h-16 w-16 items-center justify-center border-2 border-white/85 text-xl font-bold leading-none">
            <span className="block -translate-y-[2px] leading-none">{getInitials(personal.fullName)}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold uppercase leading-tight tracking-normal">{personal.fullName || "Your Name"}</h1>
            <p className="mt-1 text-xs uppercase tracking-normal text-white/85">{data.title || "Resume"}</p>
          </div>
        </div>
        <ContactRow personal={personal} className="mx-10 border-b border-slate-200 py-3" />
      </header>
      <div className="px-10 pb-10">
        <ResumeSections data={data} accent={accent} />
      </div>
    </>
  );
}

function SidebarResume({ data, accent, inverted = false }: { data: ResumeData; accent: string; inverted?: boolean }) {
  const personal = data.personal;

  return (
    <div className={`grid min-h-[1056px] ${inverted ? "grid-cols-[1fr_270px]" : "grid-cols-[260px_1fr]"}`}>
      <aside className="px-8 py-9 text-white" style={{ backgroundColor: accent }}>
        <div className="mb-8 flex h-16 w-16 items-center justify-center bg-slate-950 text-3xl font-bold leading-none">
          <span className="block -translate-y-[3px] leading-none">{getInitials(personal.fullName).slice(0, 1)}</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-normal">{personal.fullName || "Your Name"}</h1>
        <ContactRow personal={personal} className="mt-6 text-[10px] text-white/90" stacked />
        {data.skills.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-bold uppercase">Skills</h2>
            <div className="space-y-1 text-[11px] leading-5">
              {data.skills.map((skill) => <p key={skill}>{skill}</p>)}
            </div>
          </section>
        )}
      </aside>
      <main className={`px-10 py-9 ${inverted ? "-order-1" : ""}`}>
        <ResumeSections data={{ ...data, skills: [] }} accent={accent} />
      </main>
    </div>
  );
}

function ResumeSections({
  data,
  accent,
  boxed = false,
  centered = false,
  labelColumn = false,
  leftMeta = false
  ,
  timeline = false,
  compact = false,
  airy = false
}: {
  data: ResumeData;
  accent: string;
  boxed?: boolean;
  centered?: boolean;
  labelColumn?: boolean;
  leftMeta?: boolean;
  timeline?: boolean;
  compact?: boolean;
  airy?: boolean;
}) {
  return (
    <>
      {data.summary && <Section title="Summary" accent={accent} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}><p>{data.summary}</p></Section>}
      {data.skills.length > 0 && (
        <Section title="Skills" accent={accent} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {data.skills.map((skill) => <p className="before:mr-2 before:content-['-']" key={skill}>{skill}</p>)}
          </div>
        </Section>
      )}
      {data.experience.length > 0 && (
        <Section title="Experience" accent={accent} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.experience.map((item, index) => (
            <Entry
              body={item.description}
              key={`${item.company}-${index}`}
              leftMeta={leftMeta}
              meta={[item.company, formatRange(item.startDate, item.current ? "Present" : item.endDate)].filter(Boolean).join(" | ")}
              title={item.role}
            />
          ))}
        </Section>
      )}
      {data.projects.length > 0 && (
        <Section title="Projects" accent={accent} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.projects.map((item, index) => <Entry key={`${item.name}-${index}`} title={item.name} meta={[item.technologies, item.github, item.live].filter(Boolean).join(" | ")} body={item.description} />)}
        </Section>
      )}
      {data.education.length > 0 && (
        <Section title="Education" accent={accent} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.education.map((item, index) => <Entry key={`${item.college}-${index}`} title={item.degree} meta={`${item.college} | ${formatRange(item.startDate, item.endDate)}${item.cgpa ? ` | CGPA ${item.cgpa}` : ""}`} />)}
        </Section>
      )}
      {data.certifications.length > 0 && (
        <Section title="Certifications" accent={accent} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.certifications.map((item, index) => <Entry key={`${item.name}-${index}`} title={item.name} meta={`${item.provider} | ${formatMonth(item.date)}`} />)}
        </Section>
      )}
      {data.achievements.length > 0 && (
        <Section title="Achievements" accent={accent} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.achievements.map((achievement, index) => <Entry key={`${achievement.title}-${index}`} title={achievement.title || "Achievement"} body={achievement.description} />)}
        </Section>
      )}
    </>
  );
}

function Section({ title, accent, boxed, centered, labelColumn, timeline, compact, airy, children }: { title: string; accent: string; boxed?: boolean; centered?: boolean; labelColumn?: boolean; timeline?: boolean; compact?: boolean; airy?: boolean; children: React.ReactNode }) {
  if (labelColumn) {
    return (
      <section className="resume-section mt-5 grid break-inside-avoid grid-cols-[130px_1fr] gap-5 border-t border-slate-200 pt-4 [page-break-inside:avoid]">
        <h2 className="text-right text-[11px] font-semibold uppercase tracking-normal" style={{ color: accent }}>{title}</h2>
        <div className="space-y-3 text-[12px] leading-5">{children}</div>
      </section>
    );
  }

  return (
    <section className={cn("resume-section break-inside-avoid pt-3 [page-break-inside:avoid]", compact ? "mt-3" : airy ? "mt-8" : "mt-5", boxed ? "border-y border-slate-200 py-3" : timeline ? "border-l-2 pl-5" : "border-t border-slate-200", centered && "text-center")} style={timeline ? { borderColor: accent } : undefined}>
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-normal" style={{ color: accent }}>{title}</h2>
      <div className="space-y-3 text-[12px] leading-5">{children}</div>
    </section>
  );
}

function Entry({ title, meta, body, leftMeta = false }: { title: string; meta?: string; body?: string; leftMeta?: boolean }) {
  const cleanBody = cleanResumeText(body);

  if (leftMeta) {
    return (
      <div className="resume-entry grid break-inside-avoid grid-cols-[130px_1fr] gap-5 [page-break-inside:avoid]">
        {meta && <p className="text-[10px] font-semibold text-slate-700">{meta}</p>}
        <div>
          <h3 className="min-w-0 break-words text-[13px] font-bold">{title}</h3>
          {cleanBody && <p className="mt-1 break-words text-slate-700">{cleanBody}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="resume-entry break-inside-avoid [page-break-inside:avoid]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <h3 className="min-w-0 break-words text-[13px] font-bold uppercase">{title}</h3>
        {meta && <p className="max-w-[340px] text-right text-[10px] text-slate-500">{meta}</p>}
      </div>
      {cleanBody && <p className="mt-1 break-words text-slate-700">{cleanBody}</p>}
    </div>
  );
}

function ContactRow({ personal, className, stacked = false }: { personal: ResumeData["personal"]; className?: string; stacked?: boolean }) {
  const items = [personal.email, personal.phone, personal.location, personal.linkedin, personal.github, personal.portfolio].filter(Boolean);

  if (stacked) {
    return (
      <div className={cn("grid gap-2 text-[11px] text-slate-600", className)}>
        {items.map((item) => <span className="min-w-0 max-w-full break-all leading-5" key={item}>{item}</span>)}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600", className)}>
      {items.map((item) => <span className="min-w-0 max-w-full break-all" key={item}>{item}</span>)}
    </div>
  );
}

function cleanResumeText(value?: string) {
  return (value ?? "")
    .replace(/-\s*\n\s*/g, "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRange(start?: string, end?: string) {
  const cleanStart = formatMonth(start);
  const cleanEnd = end === "Present" ? "Present" : formatMonth(end);
  if (cleanStart && cleanEnd) return `${cleanStart} - ${cleanEnd}`;
  return cleanStart || cleanEnd;
}

function formatMonth(value?: string) {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})/);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getInitials(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "YN";
}
