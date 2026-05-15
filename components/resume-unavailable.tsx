import Link from "next/link";
import { ArrowLeft, EyeOff, Home } from "lucide-react";

export function ResumeUnavailable() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <Link className="text-xl font-black sm:text-2xl" href="/">
            DraftCareer
          </Link>
          <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold hover:bg-muted" href="/">
            <Home size={16} /> Home
          </Link>
        </nav>
      </header>
      <section className="grid min-h-[calc(100vh-73px)] place-items-center px-4 py-12">
        <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 text-center shadow-[0_26px_90px_rgba(15,23,42,0.16)] dark:shadow-[0_26px_90px_rgba(0,0,0,0.36)] sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-muted text-primary">
            <EyeOff size={34} />
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight">This resume is private.</h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            The owner has turned off public sharing for this resume.
          </p>
          <Link className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground hover:bg-primary/90" href="/">
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
