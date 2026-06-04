"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Mail, RotateCcw, Search, ShieldCheck, Sparkles, X, ZapOff } from "lucide-react";
import { toast } from "sonner";
import { UserBlockButton } from "@/components/user-block-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

export type StatsUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  lastAppUseAt: string;
  resumeCount: number;
  publicResumeCount: number;
  privateResumeCount: number;
  aiEnhanceCount: number;
  aiEnhanceDailyCount: number;
  aiEnhanceBlocked: boolean;
};

type StatusFilter = "all" | "verified" | "unverified" | "blocked" | "active";
type SortKey = "name" | "status" | "createdAt" | "lastAppUseAt" | "resumeCount" | "publicResumeCount" | "privateResumeCount" | "aiEnhanceDailyCount" | "aiEnhanceCount";
type SortDirection = "asc" | "desc";
type EnhanceState = Record<string, { dailyCount: number; blocked: boolean }>;

export function StatsUsersTable({ currentUserId, rows }: { currentUserId: string; rows: StatsUserRow[] }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("lastAppUseAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [enhanceState, setEnhanceState] = useState<EnhanceState>({});
  const [enhanceAction, setEnhanceAction] = useState<string | null>(null);
  const [confirmEnhanceAction, setConfirmEnhanceAction] = useState<{ user: StatsUserRow; action: "reset" | "block" } | null>(null);

  const filteredRows = useMemo(() => {
    const search = name.trim().toLowerCase();
    const activeCutoff = Date.now() - 5 * 60 * 1000;

    const nextRows = rows.filter((row) => {
      const matchesName = !search || `${row.name} ${row.email}`.toLowerCase().includes(search);
      const state = getAiState(row, enhanceState);
      const matchesStatus =
        status === "all" ||
        (status === "verified" && row.emailVerified) ||
        (status === "unverified" && !row.emailVerified) ||
        (status === "blocked" && (row.isBlocked || state.blocked)) ||
        (status === "active" && row.lastSeenAt !== null && new Date(row.lastSeenAt).getTime() >= activeCutoff);

      return matchesName && matchesStatus;
    });

    return nextRows.sort((first, second) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      return compareRows(first, second, sortKey, enhanceState) * direction;
    });
  }, [enhanceState, name, rows, sortDirection, sortKey, status]);

  const hasFilters = Boolean(name || status !== "all");

  function updateSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "name" || key === "status" ? "asc" : "desc");
  }

  function clearFilters() {
    setName("");
    setStatus("all");
  }

  async function updateUserEnhance(user: StatsUserRow, action: "reset" | "block") {
    const current = getAiState(user, enhanceState);
    const actionKey = `${user.id}-${action}`;
    setEnhanceAction(actionKey);
    try {
      const body = action === "reset"
        ? { resetCount: true }
        : { aiEnhanceBlocked: !current.blocked };
      const response = await fetch(`/api/admin/users/${user.id}/ai-enhance`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setEnhanceState((state) => ({
        ...state,
          [user.id]: {
          dailyCount: result.user.aiEnhanceDailyCount,
          blocked: result.user.aiEnhanceBlocked
        }
      }));
      toast.success(action === "reset" ? "Enhance count reset" : result.user.aiEnhanceBlocked ? "AI enhance blocked" : "AI enhance unblocked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setEnhanceAction(null);
      setConfirmEnhanceAction(null);
    }
  }

  const confirmAiState = confirmEnhanceAction ? getAiState(confirmEnhanceAction.user, enhanceState) : null;

  function renderActions(row: StatsUserRow, compact = false) {
    const aiState = getAiState(row, enhanceState);
    const buttonSizeClass = compact ? "h-8 w-8" : "h-8 w-8";

    return (
      <div className={`flex items-center ${compact ? "justify-end gap-1" : "justify-center gap-1.5"}`}>
        <Button
          className={buttonSizeClass}
          loading={enhanceAction === `${row.id}-reset`}
          size="icon"
          title="Reset AI enhance count"
          type="button"
          variant="secondary"
          onClick={() => setConfirmEnhanceAction({ user: row, action: "reset" })}
        >
          <RotateCcw size={14} />
        </Button>
        <Button
          className={`${aiState.blocked ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" : "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"} ${buttonSizeClass ?? ""}`.trim()}
          loading={enhanceAction === `${row.id}-block`}
          size="icon"
          title={aiState.blocked ? "Unblock AI enhance" : "Block AI enhance"}
          type="button"
          variant="secondary"
          onClick={() => setConfirmEnhanceAction({ user: row, action: "block" })}
        >
          {aiState.blocked ? <ShieldCheck size={14} /> : <ZapOff size={14} />}
        </Button>
        <UserBlockButton
          className={buttonSizeClass}
          disabled={row.id === currentUserId}
          initialBlocked={row.isBlocked}
          iconOnly
          userId={row.id}
          userName={row.name}
        />
      </div>
    );
  }

  return (
    <Card className="mt-6 w-full max-w-full min-w-0 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">Active means seen in the last 5 minutes. Last app use is shown in India time.</p>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 p-0">
        <div className="border-t border-border p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr)_220px]">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">Name or email</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <Input className="pl-9" placeholder="Search by name or email" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-muted-foreground">Status</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
              >
                <option value="all">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="blocked">Blocked</option>
                <option value="active">Active</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredRows.length}</span> of {rows.length} users
            </p>
            {hasFilters && (
              <Button size="sm" type="button" variant="ghost" onClick={clearFilters}>
                <X size={15} /> Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="divide-y divide-border md:hidden">
          {filteredRows.map((row) => {
            const aiState = getAiState(row, enhanceState);

            return (
              <div className="bg-surface p-4" key={row.id}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{row.name}</p>
                    <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                      <Mail size={12} /> <span className="truncate">{row.email}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={row.emailVerified ? "success" : "muted"}>{row.emailVerified ? "Verified" : "Unverified"}</Badge>
                      {row.isBlocked && <Badge tone="danger">User blocked</Badge>}
                      {aiState.blocked && <Badge tone="danger">AI blocked</Badge>}
                    </div>
                  </div>
                  {renderActions(row, true)}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <MobileMetric label="Resumes" value={row.resumeCount} />
                  <MobileMetric label="Public" value={row.publicResumeCount} />
                  <MobileMetric label="Private" value={row.privateResumeCount} />
                  <MobileMetric label="AI today" value={aiState.dailyCount} icon={<Sparkles size={12} />} />
                  <MobileMetric label="AI total" value={row.aiEnhanceCount} />
                  <MobileMetric label="Created" value={formatShortDate(row.createdAt)} />
                </div>

                <div className="mt-3 rounded-md border border-border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
                  Last app use <span className="font-bold text-foreground">{formatDate(row.lastAppUseAt)}</span>
                </div>
              </div>
            );
          })}
          {filteredRows.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No users match these filters.
            </div>
          )}
        </div>

        <div className="hidden w-full max-w-full min-w-0 overflow-hidden md:block">
          <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm lg:min-w-[1180px]">
            <thead className="border-y border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-30 w-[124px] bg-muted px-3 py-3 text-center font-bold">Action</th>
                <SortableHead activeKey={sortKey} className="sticky left-[124px] z-30 w-[280px] bg-muted" direction={sortDirection} label="User" sortKey="name" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Resumes" sortKey="resumeCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Public" sortKey="publicResumeCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Private" sortKey="privateResumeCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="AI today" sortKey="aiEnhanceDailyCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="AI total" sortKey="aiEnhanceCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Created" sortKey="createdAt" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Last use" sortKey="lastAppUseAt" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Status" sortKey="status" onSort={updateSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((row) => (
                <tr className="group bg-surface transition hover:bg-muted/35" key={row.id}>
                  <td className="sticky left-0 z-20 w-[124px] bg-surface px-3 py-3 transition group-hover:bg-muted/35">
                    {renderActions(row)}
                  </td>
                  <td className="sticky left-[124px] z-20 w-[280px] bg-surface px-3 py-3 transition group-hover:bg-muted/35">
                    <div className="min-w-0 text-left">
                      <p className="truncate font-semibold">{row.name}</p>
                      <p className="mt-0.5 flex max-w-[230px] items-center gap-1 truncate text-xs text-muted-foreground" title={row.email}>
                        <Mail className="shrink-0" size={12} /> <span className="truncate">{row.email}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{row.resumeCount}</td>
                  <td className="px-4 py-3 text-center">{row.publicResumeCount}</td>
                  <td className="px-4 py-3 text-center">{row.privateResumeCount}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="text-primary" size={14} />
                      <span className="font-bold">{getAiState(row, enhanceState).dailyCount}</span>
                      {getAiState(row, enhanceState).blocked && <Badge tone="danger">AI blocked</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{row.aiEnhanceCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-muted-foreground">{formatDate(row.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-muted-foreground">{formatDate(row.lastAppUseAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
                      {row.isBlocked && <Badge tone="danger">Blocked</Badge>}
                      <Badge tone={row.emailVerified ? "success" : "muted"}>{row.emailVerified ? "Verified" : "Unverified"}</Badge>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-muted-foreground" colSpan={10}>
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </CardContent>
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={confirmEnhanceAction?.action === "reset" ? "Reset count" : confirmAiState?.blocked ? "Unblock AI" : "Block AI"}
        description={
          confirmEnhanceAction?.action === "reset"
            ? `This will set ${confirmEnhanceAction.user.name}'s AI enhancement count for today back to 0.`
            : confirmAiState?.blocked
              ? `${confirmEnhanceAction?.user.name} will be able to use AI enhancement again if they have chances left.`
              : `${confirmEnhanceAction?.user.name} will not be able to use AI enhancement, even if they have chances left.`
        }
        loading={confirmEnhanceAction ? enhanceAction === `${confirmEnhanceAction.user.id}-${confirmEnhanceAction.action}` : false}
        open={confirmEnhanceAction !== null}
        title={
          confirmEnhanceAction?.action === "reset"
            ? "Reset today's AI count?"
            : confirmAiState?.blocked
              ? "Unblock AI enhancement?"
              : "Block AI enhancement?"
        }
        variant={confirmEnhanceAction?.action === "block" && !confirmAiState?.blocked ? "danger" : "primary"}
        onCancel={() => {
          if (!enhanceAction) setConfirmEnhanceAction(null);
        }}
        onConfirm={() => {
          if (confirmEnhanceAction) updateUserEnhance(confirmEnhanceAction.user, confirmEnhanceAction.action);
        }}
      />
    </Card>
  );
}

function SortableHead({
  activeKey,
  className = "",
  direction,
  label,
  onSort,
  sortKey
}: {
  activeKey: SortKey;
  className?: string;
  direction: SortDirection;
  label: string;
  onSort: (key: SortKey) => void;
  sortKey: SortKey;
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <th className={`px-4 py-3 text-center font-bold ${className}`}>
      <button
        className={`mx-auto inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition hover:text-foreground ${active ? "text-foreground" : ""}`}
        type="button"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon size={14} />
      </button>
    </th>
  );
}

function MobileMetric({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-muted/30 px-2.5 py-2">
      <p className="truncate text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1 truncate text-sm font-black text-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {value}
      </p>
    </div>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "muted" | "danger" }) {
  const classes = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    muted: "bg-muted text-muted-foreground",
    danger: "bg-red-500/10 text-red-700 dark:text-red-300"
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${classes[tone]}`}>{children}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

function compareRows(first: StatsUserRow, second: StatsUserRow, sortKey: SortKey, enhanceState: EnhanceState) {
  if (sortKey === "name") return first.name.localeCompare(second.name);
  if (sortKey === "status") return statusRank(first, enhanceState) - statusRank(second, enhanceState);
  if (sortKey === "createdAt" || sortKey === "lastAppUseAt") {
    return new Date(first[sortKey]).getTime() - new Date(second[sortKey]).getTime();
  }
  if (sortKey === "aiEnhanceDailyCount") {
    return (enhanceState[first.id]?.dailyCount ?? first.aiEnhanceDailyCount) - (enhanceState[second.id]?.dailyCount ?? second.aiEnhanceDailyCount);
  }
  return first[sortKey] - second[sortKey];
}

function getAiState(row: StatsUserRow, enhanceState: EnhanceState) {
  return enhanceState[row.id] ?? { dailyCount: row.aiEnhanceDailyCount, blocked: row.aiEnhanceBlocked };
}

function statusRank(row: StatsUserRow, enhanceState: EnhanceState) {
  if (row.isBlocked) return 3;
  if (enhanceState[row.id]?.blocked ?? row.aiEnhanceBlocked) return 3;
  if (!row.emailVerified) return 2;
  return 1;
}
