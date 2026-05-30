"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Mail, Search, X } from "lucide-react";
import { UserBlockButton } from "@/components/user-block-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
};

type StatusFilter = "all" | "verified" | "unverified" | "blocked" | "active";
type SortKey = "name" | "status" | "createdAt" | "lastAppUseAt" | "resumeCount" | "publicResumeCount" | "privateResumeCount";
type SortDirection = "asc" | "desc";

export function StatsUsersTable({ currentUserId, rows }: { currentUserId: string; rows: StatsUserRow[] }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("lastAppUseAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filteredRows = useMemo(() => {
    const search = name.trim().toLowerCase();
    const activeCutoff = Date.now() - 5 * 60 * 1000;

    const nextRows = rows.filter((row) => {
      const matchesName = !search || `${row.name} ${row.email}`.toLowerCase().includes(search);
      const matchesStatus =
        status === "all" ||
        (status === "verified" && row.emailVerified) ||
        (status === "unverified" && !row.emailVerified) ||
        (status === "blocked" && row.isBlocked) ||
        (status === "active" && row.lastSeenAt !== null && new Date(row.lastSeenAt).getTime() >= activeCutoff);

      return matchesName && matchesStatus;
    });

    return nextRows.sort((first, second) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      return compareRows(first, second, sortKey) * direction;
    });
  }, [name, rows, sortDirection, sortKey, status]);

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
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="border-y border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <SortableHead activeKey={sortKey} direction={sortDirection} label="User" sortKey="name" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Resumes" sortKey="resumeCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Public" sortKey="publicResumeCount" onSort={updateSort} />
                <SortableHead activeKey={sortKey} direction={sortDirection} label="Private" sortKey="privateResumeCount" onSort={updateSort} />
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
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(row.lastAppUseAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                      {row.isBlocked && <Badge tone="danger">Blocked</Badge>}
                      <Badge tone={row.emailVerified ? "success" : "muted"}>{row.emailVerified ? "Verified" : "Unverified"}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <UserBlockButton
                      disabled={row.id === currentUserId}
                      initialBlocked={row.isBlocked}
                      iconOnly
                      userId={row.id}
                      userName={row.name}
                    />
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-muted-foreground" colSpan={8}>
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
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

function compareRows(first: StatsUserRow, second: StatsUserRow, sortKey: SortKey) {
  if (sortKey === "name") return first.name.localeCompare(second.name);
  if (sortKey === "status") return statusRank(first) - statusRank(second);
  if (sortKey === "createdAt" || sortKey === "lastAppUseAt") {
    return new Date(first[sortKey]).getTime() - new Date(second[sortKey]).getTime();
  }
  return first[sortKey] - second[sortKey];
}

function statusRank(row: StatsUserRow) {
  if (row.isBlocked) return 3;
  if (!row.emailVerified) return 2;
  return 1;
}
