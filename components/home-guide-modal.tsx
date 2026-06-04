"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, LogIn, Share2, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

let shownInThisAppSession = false;

const steps = [
  { Icon: LogIn, label: "Login" },
  { Icon: Wand2, label: "Pick template" },
  { Icon: FileText, label: "Fill details" },
  { Icon: Sparkles, label: "Enhance with AI" },
  { Icon: Download, label: "Export PDF" },
  { Icon: Share2, label: "Share link" }
];

const nodes = [
  { x: 80, y: 110, label: "left" },
  { x: 210, y: 52, label: "top" },
  { x: 200, y: 155, label: "bottom" },
  { x: 345, y: 172, label: "bottom" },
  { x: 490, y: 88, label: "top" },
  { x: 618, y: 152, label: "right" }
] as const;

const VB_W = 700;
const VB_H = 230;
const R = 26;
const GRAD_ID = "guideLineGrad";

export function HomeGuideModal({ builderHref }: { builderHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (shownInThisAppSession) return;
    const timer = window.setTimeout(() => {
      shownInThisAppSession = true;
      setOpen(true);
    }, 650);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex animate-guideBackdrop items-center justify-center bg-slate-950/60 px-3 py-6 backdrop-blur-sm sm:px-4"
      onMouseDown={close}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md animate-guideModal overflow-y-auto overflow-hidden rounded-xl border border-border bg-surface text-surface-foreground shadow-[0_28px_90px_rgba(2,6,23,0.35)] sm:max-w-lg md:w-[80vw] md:max-w-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:30px_30px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-[2px] w-1/3 animate-[guideBar_2.4s_ease-in-out_infinite] bg-primary/60"
        />

        <div className="relative flex flex-col gap-4 p-4 sm:p-5 md:p-7">
          <button
            aria-label="Close guide"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted sm:right-4 sm:top-4 sm:h-9 sm:w-9"
            type="button"
            onClick={close}
          >
            <X size={16} />
          </button>

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

          <JourneyMap />

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
      </div>
    </div>
  );
}

function JourneyMap() {
  return (
    <div className="relative w-full" style={{ paddingBottom: `${(VB_H / VB_W) * 100}%`, maxHeight: "210px" }}>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
      >
        <defs>
          <linearGradient id={GRAD_ID} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>

        {nodes.slice(0, -1).map((a, i) => {
          const b = nodes[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / dist;
          const uy = dy / dist;
          const x1 = a.x + ux * R;
          const y1 = a.y + uy * R;
          const x2 = b.x - ux * R;
          const y2 = b.y - uy * R;
          const seg = `M${x1} ${y1} L${x2} ${y2}`;

          return (
            <g key={`${a.x}-${b.x}`}>
              <path d={seg} stroke={`url(#${GRAD_ID})`} strokeLinecap="round" strokeOpacity="0.18" strokeWidth="10" />
              <path
                className="animate-guideLine"
                d={seg}
                pathLength={1}
                stroke={`url(#${GRAD_ID})`}
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset="1"
                strokeOpacity="0.9"
                strokeWidth="2.5"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            </g>
          );
        })}

        {steps.map(({ Icon, label }, i) => {
          const n = nodes[i];
          const t = i / (steps.length - 1);
          const nodeStroke = t < 0.5
            ? interpolateColor("#6366f1", "#0ea5e9", t * 2)
            : interpolateColor("#0ea5e9", "#14b8a6", (t - 0.5) * 2);
          const iconSize = 20;
          const GAP = R + 10;
          let lx = n.x;
          let ly = n.y;
          let anchor: "start" | "middle" | "end" = "middle";

          if (n.label === "top") { ly = n.y - GAP; anchor = "middle"; }
          if (n.label === "bottom") { ly = n.y + GAP + 4; anchor = "middle"; }
          if (n.label === "left") { lx = n.x - GAP; ly = n.y; anchor = "end"; }
          if (n.label === "right") { lx = n.x + GAP; ly = n.y; anchor = "start"; }

          return (
            <g className="animate-guideNode" key={label} style={{ animationDelay: `${i * 80}ms`, transformOrigin: `${n.x}px ${n.y}px` }}>
              <circle cx={n.x} cy={n.y} fill={nodeStroke} fillOpacity="0.06" r={R + 10} />
              <circle cx={n.x} cy={n.y} fill="var(--surface, white)" r={R} stroke={nodeStroke} strokeWidth="2.2" />
              <foreignObject height={iconSize} style={{ overflow: "visible" }} width={iconSize} x={n.x - iconSize / 2} y={n.y - iconSize / 2}>
                <div style={{ alignItems: "center", color: nodeStroke, display: "flex", height: iconSize, justifyContent: "center", width: iconSize }}>
                  <Icon size={iconSize} strokeWidth={2} />
                </div>
              </foreignObject>

              {n.label === "top" || n.label === "bottom" ? (
                <>
                  <text className="font-sans uppercase text-surface-foreground" fill="currentColor" fillOpacity="0.4" fontSize="9" fontWeight="900" letterSpacing="0.08em" textAnchor={anchor} x={lx} y={n.label === "top" ? ly - 16 : ly}>
                    Step {i + 1}
                  </text>
                  <text className="font-sans text-surface-foreground" fill="currentColor" fillOpacity="0.88" fontSize="12" fontWeight="700" textAnchor={anchor} x={lx} y={n.label === "top" ? ly - 3 : ly + 13}>
                    {label}
                  </text>
                </>
              ) : (
                <>
                  <text className="font-sans uppercase text-surface-foreground" fill="currentColor" fillOpacity="0.4" fontSize="9" fontWeight="900" letterSpacing="0.08em" textAnchor={anchor} x={lx} y={ly - 7}>
                    Step {i + 1}
                  </text>
                  <text className="font-sans text-surface-foreground" fill="currentColor" fillOpacity="0.88" fontSize="12" fontWeight="700" textAnchor={anchor} x={lx} y={ly + 6}>
                    {label}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function interpolateColor(a: string, b: string, t: number) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}
