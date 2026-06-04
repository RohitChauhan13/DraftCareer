import type { CSSProperties } from "react";
import type { HardcodedTemplateId, ResumeData, ResumeSectionKey } from "@/types/resume";
import { cn } from "@/lib/utils";
import { getTheme } from "@/templates/resume-options";

const templateFonts: Record<HardcodedTemplateId, string> = {
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

type ResumePreviewAppearance = "system" | "light";
type ResumePreviewDiff = {
  side: "before" | "after";
  otherData: ResumeData;
};

export function ResumePreview({
  data,
  zoom = 1,
  compact = false,
  appearance = "system",
  fitContent = false,
  diff
}: {
  data: ResumeData;
  zoom?: number;
  compact?: boolean;
  appearance?: ResumePreviewAppearance;
  fitContent?: boolean;
  diff?: ResumePreviewDiff;
}) {
  const theme = getTheme(data.themeId);
  const accent = data.themeColor ?? theme.color;
  const allowDark = appearance === "system";
  const scaledWidth = 816 * zoom;
  const scaledMinHeight = 1056 * zoom;
  const paperClassName = cn(
    "w-[816px] origin-top-left bg-white text-slate-900 transition",
    !fitContent && "min-h-[1056px]",
    allowDark && "dark:bg-slate-950 dark:text-slate-100",
    compact ? "" : "shadow-soft",
    templateFonts[data.templateId as HardcodedTemplateId] ?? "font-sans"
  );
  const paperColorStyle = colorStyle(data.textColors.background, "backgroundColor");
  const paperContent = ["developer", "split"].includes(data.templateId) ? (
    <SidebarResume data={data} accent={accent} allowDark={allowDark} diff={diff} fitContent={fitContent} inverted={data.templateId === "split"} />
  ) : (
    <StandardResume data={data} accent={accent} allowDark={allowDark} diff={diff} fitContent={fitContent} />
  );

  if (fitContent) {
    return (
      <article
        data-resume-paper
        className={paperClassName}
        style={{ ...paperColorStyle, zoom } as CSSProperties}
      >
        {paperContent}
      </article>
    );
  }

  return (
    <div className="mx-auto" style={{ width: `${scaledWidth}px`, minHeight: `${scaledMinHeight}px` }}>
      <article
        data-resume-paper
        className={paperClassName}
        style={{ ...paperColorStyle, transform: `scale(${zoom})` }}
      >
        {paperContent}
      </article>
    </div>
  );
}

function StandardResume({ data, accent, allowDark, diff, fitContent = false }: { data: ResumeData; accent: string; allowDark: boolean; diff?: ResumePreviewDiff; fitContent?: boolean }) {
  const personal = data.personal;
  const nameStyle = colorStyle(data.textColors.name);
  const initialsStyle = getInitialsBoxStyle(data);
  const initialsPositionClass = getInitialsPositionClass(data);

  if (data.templateId === "classic") {
    return (
      <div className="px-12 py-9 text-center">
        <h1 className="text-3xl font-bold uppercase tracking-normal" style={{ color: data.textColors.name ?? accent }}>{personal.fullName || "Your Name"}</h1>
        <ContactRow personal={personal} allowDark={allowDark} className={cn("justify-center border-b border-t border-slate-200 py-2", allowDark && "dark:border-slate-700")} />
        <ResumeSections data={data} accent={accent} allowDark={allowDark} centered diff={diff} />
      </div>
    );
  }

  if (data.templateId === "editorial") {
    return (
      <div className="px-14 py-12">
        <header className="mb-8 grid grid-cols-[1fr_170px] items-end gap-8">
          <h1 className="text-5xl font-semibold uppercase leading-none tracking-normal" style={nameStyle}>{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} allowDark={allowDark} className="justify-end text-right" />
        </header>
        <div className="h-3 w-40" style={{ backgroundColor: accent }} />
        <ResumeSections data={data} accent={accent} allowDark={allowDark} airy diff={diff} />
      </div>
    );
  }

  if (data.templateId === "minimal") {
    return (
      <div className="px-14 py-10">
        <h1 className={cn("border-b border-slate-300 pb-2 text-4xl font-semibold uppercase tracking-normal", allowDark && "dark:border-slate-700")} style={nameStyle}>{personal.fullName || "Your Name"}</h1>
        <ContactRow personal={personal} allowDark={allowDark} className="py-2" />
        <ResumeSections data={data} accent={accent} allowDark={allowDark} leftMeta diff={diff} />
      </div>
    );
  }

  if (data.templateId === "compact") {
    return (
      <div className="px-10 py-8">
        <header className="border-b-4 pb-3" style={{ borderColor: accent }}>
          <h1 className="text-3xl font-bold uppercase tracking-normal" style={nameStyle}>{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} allowDark={allowDark} className="mt-1" />
        </header>
        <ResumeSections data={data} accent={accent} allowDark={allowDark} compact diff={diff} />
      </div>
    );
  }

  if (data.templateId === "ats") {
    return (
      <div className="px-12 py-9">
        <header className={cn("border-b border-slate-300 pb-3 text-center", allowDark && "dark:border-slate-700")}>
          <h1 className="text-2xl font-bold uppercase tracking-normal" style={nameStyle}>{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} allowDark={allowDark} className="justify-center" />
        </header>
        <ResumeSections data={data} accent={accent} allowDark={allowDark} boxed diff={diff} />
      </div>
    );
  }

  if (data.templateId === "timeline") {
    return (
      <div className="px-12 py-9">
        <header className="mb-5 border-l-[10px] py-2 pl-5" style={{ borderColor: accent }}>
          <h1 className="text-3xl font-bold uppercase tracking-normal" style={nameStyle}>{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} allowDark={allowDark} className="mt-1" />
        </header>
        <ResumeSections data={data} accent={accent} allowDark={allowDark} timeline diff={diff} />
      </div>
    );
  }

  if (data.templateId === "accent") {
    return (
      <div className={cn("relative px-14 py-10", !fitContent && "min-h-[1056px]")} data-resume-fill-page={!fitContent || undefined}>
        <div className="absolute bottom-0 left-0 top-0 w-5" style={{ backgroundColor: accent }} />
        <header className="mb-4">
          <h1 className="text-4xl font-bold uppercase tracking-normal" style={{ color: data.textColors.name ?? accent }}>{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} allowDark={allowDark} className="mt-2" />
        </header>
          <ResumeSections data={data} accent={accent} allowDark={allowDark} diff={diff} />
      </div>
    );
  }

  if (data.templateId === "mono") {
    return (
      <div className="px-12 py-9">
        <header className="bg-slate-950 p-7 text-white">
          <p className="mb-2 text-xs uppercase" style={{ color: accent }}>Resume</p>
          <h1 className="text-3xl font-bold uppercase tracking-normal" style={nameStyle}>{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} allowDark={false} className="mt-3 text-white/80" />
        </header>
        <ResumeSections data={data} accent={accent} allowDark={allowDark} boxed diff={diff} />
      </div>
    );
  }

  if (data.templateId === "executive") {
    return (
      <>
        <header className="px-12 py-8 text-white" style={{ backgroundColor: accent }}>
          <h1 className="text-4xl font-semibold uppercase leading-tight tracking-normal" style={nameStyle}>{personal.fullName || "Your Name"}</h1>
          <ContactRow personal={personal} allowDark={false} className="mt-3 border-t border-white/25 pt-3 text-white/90" />
        </header>
        <div className="px-12 py-8">
          <ResumeSections data={data} accent={accent} allowDark={allowDark} labelColumn diff={diff} />
        </div>
      </>
    );
  }

  return (
    <>
      <header>
        <div className="px-10 py-7 text-white" style={{ backgroundColor: accent }}>
          {!data.initialsStyle.hidden && (
            <div className={cn("mb-6 flex", initialsPositionClass)}>
              <InitialsBox
                className="border-2 border-white/85"
                data={data}
                fontSize={22}
                style={initialsStyle}
                value={getInitials(personal.fullName)}
              />
            </div>
          )}
          <h1 className="text-3xl font-bold uppercase leading-tight tracking-normal" style={nameStyle}>{personal.fullName || "Your Name"}</h1>
          <p className="mt-1 text-xs uppercase tracking-normal text-white/85">{data.title || "Resume"}</p>
        </div>
        <ContactRow personal={personal} allowDark={allowDark} className={cn("mx-10 border-b border-slate-200 py-3", allowDark && "dark:border-slate-700")} />
      </header>
      <div className="px-10 pb-10">
        <ResumeSections data={data} accent={accent} allowDark={allowDark} diff={diff} />
      </div>
    </>
  );
}

function SidebarResume({ data, accent, allowDark, diff, fitContent = false, inverted = false }: { data: ResumeData; accent: string; allowDark: boolean; diff?: ResumePreviewDiff; fitContent?: boolean; inverted?: boolean }) {
  const personal = data.personal;
  const nameStyle = colorStyle(data.textColors.name);
  const initialsStyle = getInitialsBoxStyle(data, "#020617");
  const initialsPositionClass = getInitialsPositionClass(data);

  return (
    <div className={cn("grid", !fitContent && "min-h-[1056px]", inverted ? "grid-cols-[1fr_270px]" : "grid-cols-[260px_1fr]")} data-resume-fill-page={!fitContent || undefined}>
      <aside className="px-8 py-9 text-white" style={{ backgroundColor: accent }}>
        {!data.initialsStyle.hidden && (
          <div className={cn("mb-8 flex", initialsPositionClass)}>
            <InitialsBox
              data={data}
              fontSize={34}
              style={initialsStyle}
              value={getInitials(personal.fullName).slice(0, 1)}
            />
          </div>
        )}
        <h1 className="text-2xl font-bold leading-tight tracking-normal" style={nameStyle}>{personal.fullName || "Your Name"}</h1>
        <ContactRow personal={personal} allowDark={false} className="mt-6 text-[10px] text-white/90" stacked />
        {!isSectionHidden(data, "skills") && data.skills.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-bold uppercase">Skills</h2>
            <div className="space-y-1 text-[11px] leading-5">
              {data.skills.map((skill) => (
                <p className={diffHighlightClass(isChangedListItem(skill, diff?.otherData.skills), diff?.side)} key={skill}>{skill}</p>
              ))}
            </div>
          </section>
        )}
      </aside>
      <main className={`px-10 py-9 ${inverted ? "-order-1" : ""}`}>
        <ResumeSections data={{ ...data, skills: [] }} accent={accent} allowDark={allowDark} diff={diff ? { ...diff, otherData: { ...diff.otherData, skills: [] } } : undefined} />
      </main>
    </div>
  );
}

function ResumeSections({
  data,
  accent,
  allowDark,
  boxed = false,
  centered = false,
  labelColumn = false,
  leftMeta = false
  ,
  timeline = false,
  compact = false,
  airy = false,
  diff
}: {
  data: ResumeData;
  accent: string;
  allowDark: boolean;
  boxed?: boolean;
  centered?: boolean;
  labelColumn?: boolean;
  leftMeta?: boolean;
  timeline?: boolean;
  compact?: boolean;
  airy?: boolean;
  diff?: ResumePreviewDiff;
}) {
  const other = diff?.otherData;
  return (
    <>
      {!isSectionHidden(data, "summary") && data.summary && (
        <Section title="Summary" accent={accent} allowDark={allowDark} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          <p style={colorStyle(data.textColors.description)}>
            <InlineDiffText otherValue={other?.summary} side={diff?.side} value={data.summary} />
          </p>
        </Section>
      )}
      {!isSectionHidden(data, "skills") && data.skills.length > 0 && (
        <Section title="Skills" accent={accent} allowDark={allowDark} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {data.skills.map((skill) => <p className={cn("before:mr-2 before:content-['-']", diffHighlightClass(isChangedListItem(skill, other?.skills), diff?.side))} key={skill} style={colorStyle(data.textColors.description)}>{skill}</p>)}
          </div>
        </Section>
      )}
      {!isSectionHidden(data, "experience") && data.experience.length > 0 && (
        <Section title="Experience" accent={accent} allowDark={allowDark} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.experience.map((item, index) => (
            <Entry
              body={item.description}
              allowDark={allowDark}
              descriptionColor={data.textColors.description}
              diffSide={diff?.side}
              diffBodyItems={parseResumeBody(other?.experience[index]?.description).items}
              highlightMeta={isChangedText([item.company, formatRange(item.startDate, item.current ? "Present" : item.endDate)].filter(Boolean).join(" | "), other?.experience[index] ? [other.experience[index].company, formatRange(other.experience[index].startDate, other.experience[index].current ? "Present" : other.experience[index].endDate)].filter(Boolean).join(" | ") : undefined)}
              highlightTitle={isChangedText(item.role, other?.experience[index]?.role)}
              key={`${item.company}-${index}`}
              leftMeta={leftMeta}
              meta={[item.company, formatRange(item.startDate, item.current ? "Present" : item.endDate)].filter(Boolean).join(" | ")}
              metaColor={data.textColors.meta}
              subtitleColor={data.textColors.subtitle}
              title={item.role}
            />
          ))}
        </Section>
      )}
      {!isSectionHidden(data, "projects") && data.projects.length > 0 && (
        <Section title="Projects" accent={accent} allowDark={allowDark} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.projects.map((item, index) => <Entry allowDark={allowDark} descriptionColor={data.textColors.description} diffBodyItems={parseResumeBody(other?.projects[index]?.description).items} diffSide={diff?.side} highlightMeta={isChangedText([item.technologies, item.github, item.live].filter(Boolean).join(" | "), other?.projects[index] ? [other.projects[index].technologies, other.projects[index].github, other.projects[index].live].filter(Boolean).join(" | ") : undefined)} highlightTitle={isChangedText(item.name, other?.projects[index]?.name)} key={`${item.name}-${index}`} title={item.name} meta={[item.technologies, item.github, item.live].filter(Boolean).join(" | ")} metaColor={data.textColors.meta} subtitleColor={data.textColors.subtitle} body={item.description} />)}
        </Section>
      )}
      {!isSectionHidden(data, "education") && data.education.length > 0 && (
        <Section title="Education" accent={accent} allowDark={allowDark} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.education.map((item, index) => <Entry allowDark={allowDark} descriptionColor={data.textColors.description} diffBodyItems={parseResumeBody(other?.education[index]?.description).items} diffSide={diff?.side} highlightMeta={isChangedText([item.college, formatRange(item.startDate, item.endDate), formatEducationScore(item)].filter(Boolean).join(" | "), other?.education[index] ? [other.education[index].college, formatRange(other.education[index].startDate, other.education[index].endDate), formatEducationScore(other.education[index])].filter(Boolean).join(" | ") : undefined)} highlightTitle={isChangedText(item.degree, other?.education[index]?.degree)} key={`${item.college}-${index}`} title={item.degree} meta={[item.college, formatRange(item.startDate, item.endDate), formatEducationScore(item)].filter(Boolean).join(" | ")} metaColor={data.textColors.meta} subtitleColor={data.textColors.subtitle} body={item.description} />)}
        </Section>
      )}
      {!isSectionHidden(data, "certifications") && data.certifications.length > 0 && (
        <Section title="Certifications" accent={accent} allowDark={allowDark} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.certifications.map((item, index) => <Entry allowDark={allowDark} descriptionColor={data.textColors.description} diffBodyItems={parseResumeBody(other?.certifications[index]?.description).items} diffSide={diff?.side} highlightMeta={isChangedText([item.provider, formatMonth(item.date)].filter(Boolean).join(" | "), other?.certifications[index] ? [other.certifications[index].provider, formatMonth(other.certifications[index].date)].filter(Boolean).join(" | ") : undefined)} highlightTitle={isChangedText(item.name, other?.certifications[index]?.name)} key={`${item.name}-${index}`} title={item.name} meta={[item.provider, formatMonth(item.date)].filter(Boolean).join(" | ")} metaColor={data.textColors.meta} subtitleColor={data.textColors.subtitle} body={item.description} />)}
        </Section>
      )}
      {!isSectionHidden(data, "achievements") && data.achievements.length > 0 && (
        <Section title="Achievements" accent={accent} allowDark={allowDark} boxed={boxed} centered={centered} labelColumn={labelColumn} timeline={timeline} compact={compact} airy={airy}>
          {data.achievements.map((achievement, index) => <Entry allowDark={allowDark} descriptionColor={data.textColors.description} diffBodyItems={parseResumeBody(other?.achievements[index]?.description).items} diffSide={diff?.side} highlightTitle={isChangedText(achievement.title, other?.achievements[index]?.title)} key={`${achievement.title}-${index}`} title={achievement.title || "Achievement"} subtitleColor={data.textColors.subtitle} body={achievement.description} />)}
        </Section>
      )}
    </>
  );
}

function isSectionHidden(data: ResumeData, section: ResumeSectionKey) {
  return (data.hiddenSections ?? []).includes(section);
}

function Section({ title, accent, allowDark, boxed, centered, labelColumn, timeline, compact, airy, children }: { title: string; accent: string; allowDark: boolean; boxed?: boolean; centered?: boolean; labelColumn?: boolean; timeline?: boolean; compact?: boolean; airy?: boolean; children: React.ReactNode }) {
  if (labelColumn) {
    return (
      <section className={cn("resume-section mt-5 grid break-inside-avoid grid-cols-[130px_1fr] gap-5 border-t border-slate-200 pt-4 [page-break-inside:avoid]", allowDark && "dark:border-slate-700")}>
        <h2 className="text-right text-[11px] font-semibold uppercase tracking-normal" style={{ color: accent }}>{title}</h2>
        <div className="space-y-3 text-[12px] leading-5">{children}</div>
      </section>
    );
  }

  return (
    <section className={cn("resume-section break-inside-avoid pt-3 [page-break-inside:avoid]", compact ? "mt-3" : airy ? "mt-8" : "mt-5", boxed ? "border-y border-slate-200 py-3" : timeline ? "border-l-2 pl-5" : "border-t border-slate-200", allowDark && !timeline && "dark:border-slate-700", centered && "text-center")} style={timeline ? { borderColor: accent } : undefined}>
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-normal" style={{ color: accent }}>{title}</h2>
      <div className="space-y-3 text-[12px] leading-5">{children}</div>
    </section>
  );
}

function Entry({
  title,
  meta,
  body,
  allowDark,
  descriptionColor,
  diffBodyItems,
  diffSide,
  highlightMeta = false,
  highlightTitle = false,
  metaColor,
  subtitleColor,
  leftMeta = false
}: {
  title: string;
  meta?: string;
  body?: string;
  allowDark: boolean;
  descriptionColor?: string;
  diffBodyItems?: string[];
  diffSide?: ResumePreviewDiff["side"];
  highlightMeta?: boolean;
  highlightTitle?: boolean;
  metaColor?: string;
  subtitleColor?: string;
  leftMeta?: boolean;
}) {
  const bodyContent = parseResumeBody(body);
  const bodyStyle = colorStyle(descriptionColor);
  const metaStyle = colorStyle(metaColor);
  const titleStyle = colorStyle(subtitleColor);
  const titleClassName = cn("min-w-0 break-words text-[13px] font-bold", diffHighlightClass(highlightTitle, diffSide));
  const metaClassName = cn("text-[10px] font-semibold text-slate-700", allowDark && "dark:text-slate-300", diffHighlightClass(highlightMeta, diffSide));

  if (leftMeta) {
    return (
      <div className="resume-entry grid break-inside-avoid grid-cols-[130px_1fr] gap-5 [page-break-inside:avoid]">
        {meta && <p className={metaClassName} style={metaStyle}>{meta}</p>}
        <div>
          <h3 className={titleClassName} style={titleStyle}>{title}</h3>
          <ResumeBody content={bodyContent} allowDark={allowDark} diffSide={diffSide} otherItems={diffBodyItems} style={bodyStyle} />
        </div>
      </div>
    );
  }

  return (
    <div className="resume-entry break-inside-avoid [page-break-inside:avoid]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
        <h3 className={cn(titleClassName, "uppercase")} style={titleStyle}>{title}</h3>
        {meta && <p className={cn("max-w-[340px] text-right text-[10px] text-slate-500", allowDark && "dark:text-slate-400", diffHighlightClass(highlightMeta, diffSide))} style={metaStyle}>{meta}</p>}
      </div>
      <ResumeBody content={bodyContent} allowDark={allowDark} diffSide={diffSide} otherItems={diffBodyItems} style={bodyStyle} />
    </div>
  );
}

function ResumeBody({
  content,
  allowDark,
  diffSide,
  otherItems,
  style
}: {
  content: ParsedResumeBody;
  allowDark: boolean;
  diffSide?: ResumePreviewDiff["side"];
  otherItems?: string[];
  style?: CSSProperties;
}) {
  if (content.items.length === 0) return null;

  if (content.kind === "bullets") {
    return (
      <ul className={cn("mt-1 list-disc space-y-0.5 pl-4 text-slate-700", allowDark && "dark:text-slate-300")} style={style}>
        {content.items.map((item, index) => (
          <li className="break-words" key={`${item}-${index}`}>
            <InlineDiffText otherValue={otherItems?.[index]} side={diffSide} value={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("mt-1 space-y-1 text-slate-700", allowDark && "dark:text-slate-300")} style={style}>
      {content.items.map((item, index) => (
        <p className="break-words" key={`${item}-${index}`}>
          <InlineDiffText otherValue={otherItems?.[index]} side={diffSide} value={item} />
        </p>
      ))}
    </div>
  );
}

function ContactRow({ personal, allowDark, className, stacked = false }: { personal: ResumeData["personal"]; allowDark: boolean; className?: string; stacked?: boolean }) {
  const items = [personal.email, personal.phone, personal.location, personal.linkedin, personal.github, personal.portfolio].filter(Boolean);

  if (stacked) {
    return (
      <div className={cn("grid gap-2 text-[11px] text-slate-600", allowDark && "dark:text-slate-300", className)}>
        {items.map((item) => <span className="min-w-0 max-w-full break-all leading-5" key={item}>{item}</span>)}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600", allowDark && "dark:text-slate-300", className)}>
      {items.map((item) => <span className="min-w-0 max-w-full break-all" key={item}>{item}</span>)}
    </div>
  );
}

type ParsedResumeBody = {
  kind: "paragraphs" | "bullets";
  items: string[];
};

function parseResumeBody(value?: string): ParsedResumeBody {
  const raw = (value ?? "").replace(/\r\n/g, "\n").trim();
  if (!raw) return { kind: "paragraphs", items: [] };

  const hasBulletMarkers = /(?:^|\n)\s*[-*•]\s+/.test(raw) || /\s+•\s+/.test(raw);
  if (hasBulletMarkers) {
    const items = raw
      .replace(/\s+•\s+/g, "\n")
      .split(/\n+/)
      .map((item) => item.replace(/^\s*[-*•]\s+/, "").replace(/\s+/g, " ").trim())
      .filter(Boolean);

    return { kind: "bullets", items };
  }

  return {
    kind: "paragraphs",
    items: raw
      .split(/\n+/)
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean)
  };
}

function InlineDiffText({
  otherValue,
  side,
  value
}: {
  otherValue?: string;
  side?: ResumePreviewDiff["side"];
  value: string;
}) {
  if (!side) return <>{value}</>;
  const chunks = inlineDiffChunks(value, otherValue ?? "");
  const highlightClass = diffHighlightClass(true, side);

  return (
    <>
      {chunks.map((chunk, index) => (
        chunk.changed ? (
          <span className={highlightClass} key={`${chunk.text}-${index}`}>{chunk.text}</span>
        ) : (
          <span key={`${chunk.text}-${index}`}>{chunk.text}</span>
        )
      ))}
    </>
  );
}

function inlineDiffChunks(value: string, otherValue: string) {
  const tokens = tokenizeDiffText(value);
  const otherTokens = tokenizeDiffText(otherValue);
  if (tokens.length === 0) return [{ text: value, changed: false }];
  if (otherTokens.length === 0) return [{ text: value, changed: Boolean(value.trim()) }];

  const table = Array.from({ length: tokens.length + 1 }, () => Array(otherTokens.length + 1).fill(0) as number[]);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    for (let j = otherTokens.length - 1; j >= 0; j -= 1) {
      table[i][j] = normalizeDiffToken(tokens[i]) === normalizeDiffToken(otherTokens[j])
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const chunks: Array<{ text: string; changed: boolean }> = [];
  let i = 0;
  let j = 0;
  while (i < tokens.length && j < otherTokens.length) {
    if (normalizeDiffToken(tokens[i]) === normalizeDiffToken(otherTokens[j])) {
      chunks.push({ text: tokens[i], changed: false });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      chunks.push({ text: tokens[i], changed: true });
      i += 1;
    } else {
      j += 1;
    }
  }
  while (i < tokens.length) {
    chunks.push({ text: tokens[i], changed: true });
    i += 1;
  }

  return mergeDiffChunks(chunks);
}

function tokenizeDiffText(value: string) {
  return value.match(/\S+\s*/g) ?? [];
}

function normalizeDiffToken(value: string) {
  return value.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
}

function mergeDiffChunks(chunks: Array<{ text: string; changed: boolean }>) {
  return chunks.reduce<Array<{ text: string; changed: boolean }>>((merged, chunk) => {
    const previous = merged[merged.length - 1];
    if (previous && previous.changed === chunk.changed) {
      previous.text += chunk.text;
    } else {
      merged.push({ ...chunk });
    }
    return merged;
  }, []);
}

function normalizeDiffText(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function isChangedText(value: string, otherValue?: string) {
  return normalizeDiffText(value) !== normalizeDiffText(otherValue);
}

function isChangedListItem(value: string, otherValues?: string[]) {
  const normalized = normalizeDiffText(value);
  if (!normalized) return false;
  return !(otherValues ?? []).some((item) => normalizeDiffText(item) === normalized);
}

function diffHighlightClass(changed: boolean, side?: ResumePreviewDiff["side"]) {
  if (!changed || !side) return "";
  return side === "before"
    ? "rounded-sm bg-red-100 px-1 text-red-950 ring-1 ring-red-200 dark:bg-red-950/45 dark:text-red-100 dark:ring-red-900"
    : "rounded-sm bg-emerald-100 px-1 text-emerald-950 ring-1 ring-emerald-200 dark:bg-emerald-950/45 dark:text-emerald-100 dark:ring-emerald-900";
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

function InitialsBox({
  className,
  data,
  fontSize,
  style,
  value
}: {
  className?: string;
  data: ResumeData;
  fontSize: number;
  style: CSSProperties;
  value: string;
}) {
  return (
    <div className={cn("h-16 w-16 overflow-hidden text-white", className)} style={style}>
      {data.initialsStyle.image ? (
        <img alt="" className="h-full w-full object-cover" src={data.initialsStyle.image} />
      ) : (
        <InitialsSvg fontSize={fontSize} value={value} />
      )}
    </div>
  );
}

function InitialsSvg({ value, fontSize }: { value: string; fontSize: number }) {
  return (
    <svg aria-hidden="true" className="h-full w-full overflow-visible" viewBox="0 0 64 64">
      <text
        dominantBaseline="central"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={fontSize}
        fontWeight="700"
        textAnchor="middle"
        x="32"
        y="32"
      >
        {value}
      </text>
    </svg>
  );
}

function getInitialsPositionClass(data: ResumeData) {
  if (data.initialsStyle.position === "center") return "justify-center";
  if (data.initialsStyle.position === "right") return "justify-end";
  return "justify-start";
}

function formatEducationScore(item: ResumeData["education"][number]) {
  if (!item.cgpa) return "";
  if ((item.scoreType ?? "cgpa") === "percentage") return item.cgpa;
  return item.cgpa.includes("/") ? item.cgpa : `${item.cgpa}/10`;
}

function getInitialsBoxStyle(data: ResumeData, defaultBoxColor?: string): CSSProperties {
  const scale = Math.min(2.5, Math.max(1, data.initialsStyle.scale ?? 1));
  const size = 64 * scale;
  const style: CSSProperties = {
    borderRadius: data.initialsStyle.shape === "round" ? "9999px" : "0px",
    height: `${size}px`,
    width: `${size}px`
  };

  if (data.initialsStyle.letterColor) {
    style.color = data.initialsStyle.letterColor;
  }
  if (data.initialsStyle.boxColor) {
    style.backgroundColor = data.initialsStyle.boxColor;
  } else if (defaultBoxColor) {
    style.backgroundColor = defaultBoxColor;
  }
  return style;
}

function colorStyle(color?: string, property: "color" | "backgroundColor" = "color"): CSSProperties | undefined {
  return color ? { [property]: color } : undefined;
}
