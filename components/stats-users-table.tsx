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

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">Active means seen in the last 5 minutes. Last app use is shown in India time.</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
            <thead className="border-y border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <SortableHead activeKey={sortKey} direction={sortDirection} label="User" sortKey="name" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Resumes" sortKey="resumeCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Public" sortKey="publicResumeCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Private" sortKey="privateResumeCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="AI today" sortKey="aiEnhanceDailyCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="AI total" sortKey="aiEnhanceCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Created" sortKey="createdAt" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Last use" sortKey="lastAppUseAt" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Status" sortKey="status" onSort={updateSort} />
                <th className="px-4 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((row) => (
                <tr className="bg-surface transition hover:bg-muted/35" key={row.id}>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail size={12} /> {row.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">{row.resumeCount}</td>
                  <td className="px-4 py-3">{row.publicResumeCount}</td>
                  <td className="px-4 py-3">{row.privateResumeCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-primary" size={14} />
                      <span className="font-bold">{getAiState(row, enhanceState).dailyCount}</span>
                      {getAiState(row, enhanceState).blocked && <Badge tone="danger">AI blocked</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">{row.aiEnhanceCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(row.lastAppUseAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                      {row.isBlocked && <Badge tone="danger">Blocked</Badge>}
                      <Badge tone={row.emailVerified ? "success" : "muted"}>{row.emailVerified ? "Verified" : "Unverified"}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        loading={enhanceAction === `${row.id}-reset`}
                        size="icon"
                        title="Reset AI enhance count"
                        type="button"
                        variant="secondary"
                        onClick={() => setConfirmEnhanceAction({ user: row, action: "reset" })}
                      >
                        <RotateCcw size={15} />
                      </Button>
                      <Button
                        className={getAiState(row, enhanceState).blocked ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700" : "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"}
                        loading={enhanceAction === `${row.id}-block`}
                        size="icon"
                        title={getAiState(row, enhanceState).blocked ? "Unblock AI enhance" : "Block AI enhance"}
                        type="button"
                        variant="secondary"
                        onClick={() => setConfirmEnhanceAction({ user: row, action: "block" })}
                      >
                        {getAiState(row, enhanceState).blocked ? <ShieldCheck size={15} /> : <ZapOff size={15} />}
                      </Button>
                      <UserBlockButton
                        disabled={row.id === currentUserId}
                        initialBlocked={row.isBlocked}
                        iconOnly
                        userId={row.id}
                        userName={row.name}
                      />
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
  direction,
  label,
  onSort,
  sortKey
}: {
  activeKey: SortKey;
  direction: SortDirection;
  label: string;
  onSort: (key: SortKey) => void;
  sortKey: SortKey;
}) {
  const active = activeKey === sortKey;
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <th className="px-4 py-3 font-bold">
      <button
        className={`inline-flex items-center gap-1.5 whitespace-nowrap transition hover:text-foreground ${active ? "text-foreground" : ""}`}
        type="button"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon size={14} />
      </button>
    </th>
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
