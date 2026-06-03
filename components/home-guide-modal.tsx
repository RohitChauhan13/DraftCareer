"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileText, LogIn, Share2, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

let shownInThisAppSession = false;

const steps = [
  { icon: LogIn, label: "Login" },
  { icon: Wand2, label: "Pick template" },
  { icon: FileText, label: "Fill details" },
  { icon: Sparkles, label: "Enhance with AI" },
  { icon: Download, label: "Export PDF" },
  { icon: Share2, label: "Share link" }
];

export function HomeGuideModal({ builderHref }: { builderHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shownInThisAppSession) return;
    shownInThisAppSession = true;
    const timer = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 px-4 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-surface text-surface-foreground shadow-[0_28px_90px_rgba(2,6,23,0.35)]"
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 210 }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:34px_34px]" />
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              className="absolute left-0 top-0 h-1 w-full bg-primary/70"
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            />

            <div className="relative p-5 sm:p-7">
              <button
                aria-label="Close guide"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted"
                type="button"
                onClick={close}
              >
                <X size={18} />
              </button>

              <div className="pr-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                  <Sparkles size={14} /> Build smarter
                </div>
                <h2 className="max-w-xl text-3xl font-black tracking-normal sm:text-4xl">
                  Your resume in six clean moves.
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Pick, polish, export, share. The whole flow, minus the confusion.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {steps.map((step, index) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-md border border-border bg-background/90 p-4"
                    initial={{ opacity: 0, y: 14 }}
                    key={step.label}
                    transition={{ delay: 0.08 * index, duration: 0.35 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
                        <step.icon size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-black text-muted-foreground">Step {index + 1}</p>
                        <p className="font-bold">{step.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  AI helps after your details are filled.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={close}>
                    Later
                  </Button>
                  <Link
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    href={builderHref}
                    onClick={close}
                  >
                    <Sparkles size={16} /> Start
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
