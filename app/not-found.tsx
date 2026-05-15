import Link from "next/link";
import { ArrowLeft, FileQuestion, Home, LayoutDashboard } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function NotFoundPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <Link className="text-xl font-black tracking-normal sm:text-2xl" href="/">
            HireSheet
          </Link>
          <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold hover:bg-muted" href="/">
            <Home size={16} /> Home
          </Link>
        </nav>
      </header>

      <section className="relative grid min-h-[calc(100vh-73px)] place-items-center px-4 py-12">
        <div className="absolute left-1/2 top-16 h-52 w-52 -translate-x-1/2 rounded-full border border-primary/20 bg-primary/10 blur-2xl" />
        <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-surface p-6 text-center shadow-[0_26px_90px_rgba(15,23,42,0.16)] dark:shadow-[0_26px_90px_rgba(0,0,0,0.36)] sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-muted text-primary">
            <FileQuestion size={34} />
          </div>
          <p className="mt-6 text-sm font-black uppercase tracking-normal text-primary">404</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">This page slipped out of the stack.</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            The link may be old, moved, or unfinished. Let’s get you back to a place that actually exists.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground hover:bg-primary/90" href="/">
              <ArrowLeft size={16} /> Go home
            </Link>
            {user && (
              <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 text-sm font-black hover:bg-muted" href="/dashboard">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
