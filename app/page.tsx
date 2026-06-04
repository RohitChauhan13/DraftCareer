import Link from "next/link";
import { ArrowDown, CheckCircle2, FileText, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { LazyHomeGuideModal } from "@/components/lazy-home-guide-modal";
import { MainNav } from "@/components/main-nav";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://draft-career.vercel.app").replace(/\/$/, "");

const highlights = [
  "AI ATS enhancement",
  "ATS-friendly templates",
  "Guided sections",
  "PDF export"
];

const steps = [
  {
    icon: Wand2,
    title: "Start with a proven layout",
    text: "Choose a clean template built for recruiters, scanners, and fast editing."
  },
  {
    icon: Sparkles,
    title: "Enhance with AI",
    text: "Use AI to sharpen your resume for ATS keywords, clearer impact, and recruiter-friendly wording."
  },
  {
    icon: FileText,
    title: "Export with confidence",
    text: "Save your resume, return anytime, and download a polished PDF when ready."
  }
];

const homeStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DraftCareer",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: "DraftCareer is a free online AI resume builder for creating ATS-friendly resumes with professional templates, AI enhancement, live preview, saved resume history, and PDF export.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  featureList: [
    "Free resume builder",
    "AI resume enhancement",
    "ATS-friendly resume templates",
    "Live resume preview",
    "PDF resume export",
    "Saved resume history"
  ]
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DraftCareer",
  url: siteUrl,
  description: "Free online AI resume builder for ATS-friendly resumes, AI enhancement, and PDF export.",
  potentialAction: {
    "@type": "CreateAction",
    target: `${siteUrl}/builder/new`,
    name: "Create a resume"
  }
};

export default async function HomePage() {
  const [user, donationSettings] = await Promise.all([
    getCurrentUser(),
    getDonationSettings()
  ]);
  const builderHref = user ? "/builder/new" : "/signup";
  const accountHref = user ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([homeStructuredData, websiteStructuredData]) }}
      />
      <MainNav user={user ? { name: user.name, email: user.email, role: user.role } : null} showDonation={donationSettings.isPageVisible} />
      <LazyHomeGuideModal builderHref={builderHref} />

      <section className="relative">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-muted lg:block" />
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-10">
          <div className="relative z-10 max-w-2xl">
            <p className="text-lg font-extrabold text-primary sm:text-2xl">Fast. Easy. Effective.</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.08] tracking-normal text-foreground sm:mt-6 sm:text-6xl lg:text-7xl">
              Free AI resume builder for modern careers.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-7 sm:text-xl sm:leading-8">
              Create an ATS-friendly resume online with professional templates, AI-powered enhancement, live preview, saved resume history, and polished PDF export.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-4">
              <Link className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-black text-accent-foreground shadow-sm transition hover:opacity-90 sm:h-14 sm:px-8 sm:text-base" href={builderHref}>
                Create new resume
              </Link>
              <Link className="inline-flex h-12 items-center justify-center rounded-full border-2 border-primary bg-surface px-6 text-sm font-black text-primary transition hover:bg-muted sm:h-14 sm:px-8 sm:text-base" href={accountHref}>
                {user ? "Open dashboard" : "Login"}
              </Link>
            </div>

            <div className="mt-7 grid gap-3 sm:mt-8 sm:grid-cols-2">
              {highlights.map((item) => (
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground" key={item}>
                  <CheckCircle2 className="text-emerald-600" size={18} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 min-h-[500px] overflow-hidden sm:min-h-[640px] lg:min-h-[860px] xl:min-h-[900px]">
            <div className="absolute right-0 top-1/2 h-[82%] w-[82%] -translate-y-1/2 rounded-l-full bg-muted" />
            <div className="absolute right-8 top-8 h-52 w-52 rounded-tr-[5rem] bg-primary/25" />
            <div className="absolute bottom-14 left-4 h-20 w-20 rotate-45 border-[10px] border-primary/70" />
            <div className="absolute bottom-10 right-10 h-24 w-24 rounded-t-full bg-accent/30" />
            <div className="absolute left-1/2 top-8 w-[660px] max-w-none origin-top -translate-x-1/2 scale-[0.58] overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_30px_100px_rgba(0,0,0,0.42)] sm:right-8 sm:left-auto sm:top-12 sm:w-[88%] sm:max-w-[660px] sm:translate-x-0 sm:scale-[0.86] md:scale-[0.92] lg:scale-100">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">AI + ATS Ready</span>
              </div>
              <div className="grid grid-cols-[230px_1fr]">
                <aside className="bg-slate-950 px-7 py-8 text-white">
                  <div className="text-center">
                    <div className="mx-auto grid aspect-square h-20 w-20 place-items-center rounded-full bg-emerald-400 text-3xl font-black leading-none text-slate-950 ring-4 ring-white/10">
                      R
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase text-emerald-300">Profile</p>
                    <p className="mt-7 text-left leading-5 text-slate-300">Crafting sleek, scalable digital experiences.</p>
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                    <p className="rounded-md bg-white/[0.08] px-3 py-2">Near RTO office Savali, Sangli - 416410</p>
                    <p className="rounded-md bg-white/[0.08] px-3 py-2">+91 7024756186</p>
                    <p className="break-all rounded-md bg-white/[0.08] px-3 py-2">rohitchauhan6232@gmail.com</p>
                  </div>

                  <div className="mt-7">
                    <p className="text-xs font-black uppercase tracking-normal text-emerald-300">Core Skills</p>
                    <div className="mt-4 space-y-3">
                      <SkillMeter label="React / Next.js" width="92%" />
                      <SkillMeter label="TypeScript" width="86%" />
                      <SkillMeter label="UI Engineering" width="88%" />
                    </div>
                  </div>

                  <div className="mt-7 border-t border-white/10 pt-5">
                    <p className="text-xs font-black uppercase tracking-normal text-emerald-300">Impact</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Metric value="2+" label="Years" />
                      <Metric value="10+" label="Projects" />
                    </div>
                  </div>
                </aside>
                <div className="bg-white px-8 py-8 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-5 border-b border-slate-200 pb-5 dark:border-slate-800">
                    <div>
                      <h2 className="text-4xl font-black leading-tight text-slate-950 dark:text-white">Rohit Chauhan</h2>
                      <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">Software Engineer</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-4 py-3 text-xs font-black text-amber-950 dark:bg-amber-300 dark:text-slate-950">
                      PDF
                      <ArrowDown className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    AI-enhanced summary focused on product impact, accessible interfaces, clean architecture, and measurable business outcomes.
                  </p>

                  <ResumeSection
                    title="Work Experience"
                    items={[
                      ["Frontend Engineer", "Built dashboard workflows and reusable UI systems for high-traffic teams."],
                      ["Full Stack Developer", "Delivered authenticated apps with secure data flows and polished PDF output."]
                    ]}
                  />
                  <ResumeSection
                    title="Projects"
                    items={[
                      ["Resume Builder Platform", "Live preview, saved history, professional templates, and export-ready documents."]
                    ]}
                  />
                  <ResumeSection
                    title="Education"
                    items={[
                      ["Bachelor of Computer Applications", "Bharati Vidyapeeth, Sangli (2022-2025)"]
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-16 sm:px-8" id="about">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">About DraftCareer</p>
            <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">A resume builder made for people who want to move quickly and look credible.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article className="rounded-md border border-border bg-background p-6 shadow-sm" key={step.title}>
                <step.icon className="text-primary" size={26} />
                <h3 className="mt-5 text-lg font-black text-foreground">{step.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{step.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-border pt-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <ShieldCheck className="text-emerald-600" size={21} />
              Built with authenticated accounts and saved resume history.
            </div>
            <Link className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-black text-primary-foreground transition hover:bg-primary/90" href={builderHref}>
              Start building
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResumeSection({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <section className="mt-5">
      <h3 className="border-b border-slate-200 pb-2 text-sm font-black uppercase tracking-normal text-emerald-700 dark:border-slate-800 dark:text-emerald-300">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.map(([heading, text]) => (
          <div className="grid grid-cols-[11px_1fr] gap-3" key={heading}>
            <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
            <div>
              <p className="text-sm font-black text-slate-950 dark:text-white">{heading}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillMeter({ label, width }: { label: string; width: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-bold">
        <span>{label}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-emerald-400" style={{ width }} />
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.08] p-3">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase text-slate-400">{label}</p>
    </div>
  );
}
