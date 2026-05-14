import Link from "next/link";
import { CheckCircle2, FileText, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

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
  const builderHref = user ? "/builder/new" : "/signup";
  const accountHref = user ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#07142f]">
      <header className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link className="flex items-center gap-2 text-2xl font-black tracking-tight text-[#0b1d3a]" href="/">
            HireSheet
          </Link>
          <div className="flex items-center gap-3">
            <Link className="hidden rounded-md px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex" href="#about">
              About
            </Link>
            <Link className="rounded-full bg-slate-100 px-5 py-3 text-sm font-extrabold text-[#07142f] shadow-sm transition hover:bg-slate-200 sm:px-7" href={accountHref}>
              {user ? "My Account" : "Login"}
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-[#e7f0f8] lg:block" />
        <div className="mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xl font-extrabold text-[#071e91] sm:text-2xl">Fast. Easy. Effective.</p>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.08] tracking-normal text-[#07142f] sm:text-6xl lg:text-7xl">
              The resume maker built for modern careers.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              Build a new resume from scratch or improve an existing one with focused tools, professional templates, and a workspace that feels effortless.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link className="inline-flex h-14 items-center justify-center rounded-full bg-[#ffc857] px-8 text-base font-black text-[#07142f] shadow-sm transition hover:bg-[#f8bb3d]" href={builderHref}>
                Create new resume
              </Link>
              <Link className="inline-flex h-14 items-center justify-center rounded-full border-2 border-[#071e91] bg-white px-8 text-base font-black text-[#071e91] transition hover:bg-[#eef3ff]" href={accountHref}>
                {user ? "Open dashboard" : "Login"}
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700" key={item}>
                  <CheckCircle2 className="text-emerald-600" size={18} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 min-h-[520px] lg:min-h-[640px]">
            <div className="absolute right-0 top-1/2 h-[82%] w-[82%] -translate-y-1/2 rounded-l-full bg-[#e7f0f8]" />
            <div className="absolute right-8 top-8 h-52 w-52 rounded-tr-[5rem] bg-[#99e3d4]" />
            <div className="absolute bottom-14 left-4 h-20 w-20 rotate-45 border-[10px] border-[#0d78d8]" />
            <div className="absolute bottom-10 right-10 h-24 w-24 rounded-t-full bg-[#c7dff4]" />
            <div className="absolute right-8 top-20 w-[86%] max-w-[620px] rounded-md border border-slate-200 bg-white shadow-[0_26px_90px_rgba(15,23,42,0.18)] sm:right-14">
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
                  <h2 className="text-4xl font-black text-[#9e2f19]">Rohit Chauhan</h2>
                  <p className="text-lg text-[#9e2f19]">Software Engineer</p>
                  <div className="mt-5 space-y-2 text-xs text-slate-600">
                    <p>New Delhi, India 110001</p>
                    <p>+91 11 5555 5555</p>
                    <p>rohitchauhan6232@gmail.com</p>
                  </div>
                  <p className="mt-7 text-sm leading-6 text-slate-700">
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

      <section className="bg-white px-5 py-16 sm:px-8" id="about">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1f6fff]">About HireSheet</p>
            <h2 className="mt-3 text-3xl font-black text-[#07142f] sm:text-4xl">A resume builder made for people who want to move quickly and look credible.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article className="rounded-md border border-slate-200 bg-[#fbfcff] p-6 shadow-sm" key={step.title}>
                <step.icon className="text-[#1f6fff]" size={26} />
                <h3 className="mt-5 text-lg font-black text-[#07142f]">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-slate-200 pt-8 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <ShieldCheck className="text-emerald-600" size={21} />
              Built with authenticated accounts and saved resume history.
            </div>
            <Link className="inline-flex h-12 items-center justify-center rounded-full bg-[#07142f] px-7 text-sm font-black text-white transition hover:bg-[#12254a]" href={builderHref}>
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
      <h3 className="text-lg font-black text-[#9e2f19]">{title}</h3>
      <div className="mt-3 space-y-3">
        <div className="h-2 w-full rounded bg-slate-200" />
        <div className="h-2 w-5/6 rounded bg-slate-200" />
        {long && (
          <>
            <div className="h-2 w-11/12 rounded bg-slate-200" />
            <div className="h-2 w-3/4 rounded bg-slate-200" />
          </>
        )}
      </div>
    </section>
  );
}
