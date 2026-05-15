import Link from "next/link";
import { ArrowLeft, HeartOff, Sparkles } from "lucide-react";
import { MainNav } from "@/components/main-nav";

export function DonationUnavailable() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <MainNav user={null} showDonation={false} />

      <section className="relative grid min-h-[calc(100vh-73px)] place-items-center px-4 py-12">
        <div className="absolute right-8 top-24 h-40 w-40 rounded-full border border-accent/25 bg-accent/10 blur-xl" />
        <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-[0_26px_90px_rgba(15,23,42,0.16)] dark:shadow-[0_26px_90px_rgba(0,0,0,0.36)] sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-muted text-primary">
              <HeartOff size={38} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-primary">Donations paused</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Donations are temporarily unavailable.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                The donation page is turned off right now. Thanks for the kindness, truly. You can still keep building resumes.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
            <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground hover:bg-primary/90" href="/">
              <ArrowLeft size={16} /> Back home
            </Link>
            <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 text-sm font-black hover:bg-muted" href="/builder/new">
              <Sparkles size={16} /> Build resume
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
