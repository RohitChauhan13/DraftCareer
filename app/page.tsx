import Link from "next/link";
import { CheckCircle2, FileText, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDonationSettings } from "@/lib/donation";
import { ThemeToggle } from "@/components/theme-toggle";

const highlights = [
  "ATS-friendly templates",
  "Guided sections",
  "PDF export",
  "Secure account storage"
];

const steps = [
  {
    icon: Wand2,
    title: "Start with a proven layout",
    text: "Choose a clean template built for recruiters, scanners, and fast editing."
  },
  {
    icon: Sparkles,
    title: "Shape every detail",
    text: "Add experience, skills, projects, education, and links in one focused workspace."
  },
  {
    icon: FileText,
    title: "Export with confidence",
    text: "Save your resume, return anytime, and download a polished PDF when ready."
  }
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const donationSettings = await getDonationSettings();
  const builderHref = user ? "/builder/new" : "/signup";
  const accountHref = user ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="relative z-10 border-b border-border bg-surface/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
          <Link className="flex min-w-0 items-center gap-2 text-xl font-black tracking-tight text-foreground sm:text-2xl" href="/">
            DraftCareer
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link className="hidden rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted md:inline-flex" href="#about">
              About
            </Link>
            {donationSettings.isPageVisible && (
              <Link className="hidden rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted md:inline-flex" href="/donation">
                Donate us
              </Link>
            )}
            <ThemeToggle />
            <Link className="rounded-full bg-muted px-4 py-2.5 text-sm font-extrabold text-foreground shadow-sm transition hover:bg-border sm:px-7 sm:py-3" href={accountHref}>
              {user ? "My Account" : "Login"}
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-muted lg:block" />
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 py-10 sm:px-8 lg:min-h-[calc(100vh-82px)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="text-lg font-extrabold text-primary sm:text-2xl">Fast. Easy. Effective.</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.08] tracking-normal text-foreground sm:mt-6 sm:text-6xl lg:text-7xl">
              The resume maker built for modern careers.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-7 sm:text-xl sm:leading-8">
              Build a new resume from scratch or improve an existing one with focused tools, professional templates, and a workspace that feels effortless.
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

          <div className="relative z-10 min-h-[420px] overflow-hidden sm:min-h-[520px] lg:min-h-[640px]">
            <div className="absolute right-0 top-1/2 h-[82%] w-[82%] -translate-y-1/2 rounded-l-full bg-muted" />
            <div className="absolute right-8 top-8 h-52 w-52 rounded-tr-[5rem] bg-primary/25" />
            <div className="absolute bottom-14 left-4 h-20 w-20 rotate-45 border-[10px] border-primary/70" />
            <div className="absolute bottom-10 right-10 h-24 w-24 rounded-t-full bg-accent/30" />
            <div className="absolute left-1/2 top-8 w-[620px] max-w-none origin-top -translate-x-1/2 scale-[0.58] rounded-md border border-slate-200 bg-white shadow-[0_26px_90px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_26px_90px_rgba(0,0,0,0.38)] sm:right-14 sm:left-auto sm:top-20 sm:w-[86%] sm:max-w-[620px] sm:translate-x-0 sm:scale-100">
              <div className="grid grid-cols-[1fr_2.15fr]">
                <aside className="bg-[#9e2f19] px-6 py-10 text-white">
                  <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-[10px] border-[#ffc857] bg-[#f7e0d6] shadow-xl">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_50%_35%,#ffe7d6_0_18%,#20253c_19%_33%,#f3b02f_34%_100%)]" />
                  </div>
                  <div className="mt-24 space-y-16 text-xs font-bold">
                    <p>2021 - Current</p>
                    <p>2018 - 2021</p>
                    <p>2015 - 2018</p>
                  </div>
                </aside>
                <div className="px-7 py-9">
                  <h2 className="text-4xl font-black text-[#9e2f19] dark:text-[#f07a5f]">Rohit Chauhan</h2>
                  <p className="text-lg text-[#9e2f19] dark:text-[#f07a5f]">Software Engineer</p>
                  <div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p>New Delhi, India 110001</p>
                    <p>+91 11 5555 5555</p>
                    <p>rohitchauhan6232@gmail.com</p>
                  </div>
                  <p className="mt-7 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    Strategic designer with experience turning complex product goals into clear user journeys, polished systems, and measurable outcomes.
                  </p>
                  <ResumeSection title="Skills" />
                  <ResumeSection title="Work History" long />
                  <ResumeSection title="Education" />
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

function ResumeSection({ title, long = false }: { title: string; long?: boolean }) {
  return (
    <section className="mt-7">
      <h3 className="text-lg font-black text-[#9e2f19] dark:text-[#f07a5f]">{title}</h3>
      <div className="mt-3 space-y-3">
        <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-2 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
        {long && (
          <>
            <div className="h-2 w-11/12 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          </>
        )}
      </div>
    </section>
  );
}
