"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  FileText,
  LogIn,
  Share2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

let shownInThisAppSession = false;

// ─── Data ────────────────────────────────────────────────────────────────────

const steps = [
  { Icon: LogIn,    label: "Login" },
  { Icon: Wand2,    label: "Pick template" },
  { Icon: FileText, label: "Fill details" },
  { Icon: Sparkles, label: "Enhance with AI" },
  { Icon: Download, label: "Export PDF" },
  { Icon: Share2,   label: "Share link" },
];

/**
 * ViewBox: 0 0 520 340
 * Organic scatter — nodes placed with intentional asymmetry like the reference image.
 * label: "top" | "bottom" | "left" | "right" — where the label sits relative to the node.
 */
const nodes = [
  { x:  80, y: 110, label: "left"   }, // 1 Login
  { x: 210, y:  52, label: "top"    }, // 2 Pick template
  { x: 200, y: 155, label: "bottom" }, // 3 Fill details
  { x: 345, y: 172, label: "bottom" }, // 4 Enhance w/ AI
  { x: 490, y:  88, label: "top"    }, // 5 Export PDF
  { x: 618, y: 152, label: "right"  }, // 6 Share link
] as const;

// Path connecting them in order
const svgPath = nodes.map((n, i) => `${i === 0 ? "M" : "L"}${n.x} ${n.y}`).join(" ");

// ─── Modal ────────────────────────────────────────────────────────────────────

export function HomeGuideModal({ builderHref }: { builderHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shownInThisAppSession) return;
    shownInThisAppSession = true;
    const timer = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, []);

  function close() { setOpen(false); }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-3 py-6 backdrop-blur-sm sm:px-4"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface text-surface-foreground shadow-[0_28px_90px_rgba(2,6,23,0.35)] sm:max-w-lg md:w-[80vw] md:max-w-3xl max-h-[90vh] overflow-y-auto"
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 210 }}
          >
            {/* Grid texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:30px_30px]"
            />
            {/* Animated top bar */}
            <motion.div
              aria-hidden="true"
              animate={{ x: ["-100%", "100%"] }}
              className="pointer-events-none absolute left-0 top-0 h-[2px] w-full bg-primary/60"
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            />

            <div className="relative flex flex-col gap-4 p-4 sm:p-5 md:p-7">
              {/* Close */}
              <button
                aria-label="Close guide"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted sm:right-4 sm:top-4 sm:h-9 sm:w-9"
                type="button"
                onClick={close}
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="shrink-0 pr-10">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary md:text-[11px]">
                  <Sparkles size={11} /> Build smarter
                </div>
                <h2 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
                  Your resume in six clean moves.
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-sm">
                  Pick, polish, export, share. The whole flow, minus the confusion.
                </p>
              </div>

              {/* Diagram */}
              <JourneyMap />

              {/* Footer */}
              <div className="flex shrink-0 flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                  AI helps after your details are filled.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={close}>
                    Later
                  </Button>
                  <Link
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:h-10"
                    href={builderHref}
                    onClick={close}
                  >
                    <Sparkles size={15} /> Start
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

// ─── Journey Map ─────────────────────────────────────────────────────────────

const VB_W = 700;
const VB_H = 230;
const R = 26; // node radius in SVG units
const GRAD_ID = "lineGrad";

function JourneyMap() {
  return (
    <div
      className="relative w-full"
      style={{ paddingBottom: `${(VB_H / VB_W) * 100}%`, maxHeight: "210px" }}
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          {/* Blue-to-teal gradient matching the reference image */}
          <linearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#6366f1" /> {/* indigo */}
            <stop offset="50%"  stopColor="#0ea5e9" /> {/* sky */}
            <stop offset="100%" stopColor="#14b8a6" /> {/* teal */}
          </linearGradient>
        </defs>

        {/* ── Lines ── */}

        {/* Soft glow behind the line */}
        <path
          d={svgPath}
          stroke={`url(#${GRAD_ID})`}
          strokeOpacity="0.18"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated main line */}
        <motion.path
          d={svgPath}
          stroke={`url(#${GRAD_ID})`}
          strokeOpacity="0.9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />

        {/* ── Nodes ── */}
        {steps.map(({ Icon, label }, i) => {
          const n = nodes[i];

          // Gradient colour per node (interpolated along the path)
          // We use the same gradient stops mapped to 0–1
          const t = i / (steps.length - 1);
          const nodeStroke = t < 0.5
            ? interpolateColor("#6366f1", "#0ea5e9", t * 2)
            : interpolateColor("#0ea5e9", "#14b8a6", (t - 0.5) * 2);

          // Icon foreignObject centred on node
          const iconSize = 20;

          // Label offset — stays within viewBox, avoids node edge
          const GAP = R + 10;
          let lx = n.x, ly = n.y;
          let anchor: "start" | "middle" | "end" = "middle";

          if (n.label === "top")    { ly = n.y - GAP; anchor = "middle"; }
          if (n.label === "bottom") { ly = n.y + GAP + 4; anchor = "middle"; }
          if (n.label === "left")   { lx = n.x - GAP; ly = n.y; anchor = "end"; }
          if (n.label === "right")  { lx = n.x + GAP; ly = n.y; anchor = "start"; }

          // For top/bottom, two text lines; for left/right, two lines stacked
          const microY  = n.label === "bottom" ? ly      : ly - 4;
          const mainY   = n.label === "bottom" ? ly + 14 : ly + 10;
          const singleY = n.label === "top"    ? ly - 4  : ly;   // fallback

          return (
            <motion.g
              key={label}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 * i, type: "spring", damping: 13, stiffness: 190 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            >
              {/* Outer halo */}
              <circle
                cx={n.x} cy={n.y} r={R + 10}
                fill={nodeStroke}
                fillOpacity="0.06"
              />
              {/* Circle border */}
              <circle
                cx={n.x} cy={n.y} r={R}
                fill="var(--surface, white)"
                stroke={nodeStroke}
                strokeWidth="2.2"
              />

              {/* Lucide icon */}
              <foreignObject
                x={n.x - iconSize / 2}
                y={n.y - iconSize / 2}
                width={iconSize}
                height={iconSize}
                style={{ overflow: "visible" }}
              >
                <div
                  // @ts-expect-error
                  xmlns="http://www.w3.org/1999/xhtml"
                  style={{
                    width: iconSize,
                    height: iconSize,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: nodeStroke,
                  }}
                >
                  <Icon size={iconSize} strokeWidth={2} />
                </div>
              </foreignObject>

              {/* Label — "STEP N" micro + main label */}
              {(n.label === "top" || n.label === "bottom") ? (
                <>
                  <text
                    x={lx} y={n.label === "top" ? ly - 16 : ly}
                    textAnchor={anchor}
                    fontSize="9" fontWeight="900" letterSpacing="0.08em"
                    fill="currentColor" fillOpacity="0.4"
                    className="text-surface-foreground font-sans uppercase"
                  >
                    Step {i + 1}
                  </text>
                  <text
                    x={lx} y={n.label === "top" ? ly - 3 : ly + 13}
                    textAnchor={anchor}
                    fontSize="12" fontWeight="700"
                    fill="currentColor" fillOpacity="0.88"
                    className="text-surface-foreground font-sans"
                  >
                    {label}
                  </text>
                </>
              ) : (
                <>
                  <text
                    x={lx} y={ly - 7}
                    textAnchor={anchor}
                    fontSize="9" fontWeight="900" letterSpacing="0.08em"
                    fill="currentColor" fillOpacity="0.4"
                    className="text-surface-foreground font-sans uppercase"
                  >
                    Step {i + 1}
                  </text>
                  <text
                    x={lx} y={ly + 6}
                    textAnchor={anchor}
                    fontSize="12" fontWeight="700"
                    fill="currentColor" fillOpacity="0.88"
                    className="text-surface-foreground font-sans"
                  >
                    {label}
                  </text>
                </>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function interpolateColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}