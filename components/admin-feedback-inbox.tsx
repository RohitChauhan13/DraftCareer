"use client";

import { useMemo, useState } from "react";
import { Mail, MessageSquareHeart, Search, SlidersHorizontal, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

export type AdminFeedbackRow = {
  id: string;
  rating: number;
  category: string;
  message: string;
  allowContact: boolean;
  createdAt: string;
  userName: string;
  userEmail: string;
};

type SortMode = "latest" | "oldest" | "user";

const ratingOptions = [5, 4, 3, 2, 1];
const sortOptions: Array<{ label: string; value: SortMode }> = [
  { label: "Latest", value: "latest" },
  { label: "Oldest", value: "oldest" },
  { label: "User A-Z", value: "user" }
];

export function AdminFeedbackInbox({ rows }: { rows: AdminFeedbackRow[] }) {
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState<number | "all">("all");
  const [sort, setSort] = useState<SortMode>("latest");
  const [deleteTarget, setDeleteTarget] = useState<AdminFeedbackRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const averageRating = items.length ? items.reduce((sum, item) => sum + item.rating, 0) / items.length : 0;

  const visibleRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = items.filter((row) => {
      const matchesUser = !search || `${row.userName} ${row.userEmail}`.toLowerCase().includes(search);
      const matchesRating = rating === "all" || row.rating === rating;
      return matchesUser && matchesRating;
    });

    return filtered.sort((first, second) => {
      if (sort === "user") return first.userName.localeCompare(second.userName);
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return sort === "latest" ? secondTime - firstTime : firstTime - secondTime;
    });
  }, [items, query, rating, sort]);

  async function deleteFeedback() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/feedback/${deleteTarget.id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Feedback deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:w-72">
        <MiniMetric label="Total" value={items.length.toString()} />
        <MiniMetric label="Avg rating" value={averageRating ? averageRating.toFixed(1) : "0"} />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative border-b border-border bg-muted/30 p-4">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
              <label className="block">
                <span className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                  <Search size={13} /> User
                </span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                  <Input
                    className="pl-9"
                    placeholder="Search name or email"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </label>

              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                  <Star size={13} /> Stars
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip active={rating === "all"} onClick={() => setRating("all")}>
                    All
                  </FilterChip>
                  {ratingOptions.map((value) => (
                    <FilterChip active={rating === value} key={value} onClick={() => setRating(value)}>
                      <Star fill="currentColor" size={12} /> {value}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                  <SlidersHorizontal size={13} /> Order
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sortOptions.map((item) => (
                    <FilterChip active={sort === item.value} key={item.value} onClick={() => setSort(item.value)}>
                      {item.label}
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Showing <span className="font-black text-foreground">{visibleRows.length}</span> of {items.length} notes
            </p>
            {(query || rating !== "all" || sort !== "latest") && (
              <button
                className="rounded-md px-2 py-1 text-sm font-bold text-primary transition hover:bg-primary/10"
                type="button"
                onClick={() => {
                  setQuery("");
                  setRating("all");
                  setSort("latest");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {visibleRows.length === 0 ? (
        <Card>
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div>
              <MessageSquareHeart className="mx-auto text-primary" size={38} />
              <h2 className="mt-4 text-xl font-black">No matching feedback</h2>
              <p className="mt-2 text-sm text-muted-foreground">Try another user name, rating, or order.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleRows.map((item) => (
            <Card className="overflow-hidden transition hover:border-primary/40 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]" key={item.id}>
              <CardHeader className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{item.userName}</h2>
                      <Badge>{formatCategory(item.category)}</Badge>
                      {!item.allowContact && <Badge muted>No contact</Badge>}
                    </div>
                    <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <Mail size={14} /> {item.userEmail}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <Rating value={item.rating} />
                    <span className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</span>
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-black text-red-700 transition hover:bg-red-100"
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/35 p-4 text-sm leading-6">{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={<><Trash2 size={16} /> Delete</>}
        description={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.userName}'s feedback note. This action cannot be undone.`
            : "This feedback note will be permanently deleted."
        }
        loading={deleting}
        open={deleteTarget !== null}
        title="Delete feedback?"
        variant="danger"
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={deleteFeedback}
      />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-soft">
      <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-black transition ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-surface text-muted-foreground hover:border-primary/45 hover:text-foreground"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
      <Star fill="currentColor" size={14} />
      <span className="text-sm font-black">{value}/5</span>
    </div>
  );
}

function Badge({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${muted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
      {children}
    </span>
  );
}

function formatCategory(category: string) {
  const labels: Record<string, string> = {
    ai: "AI",
    bug: "Bug",
    experience: "Experience",
    export: "PDF export",
    idea: "Idea",
    other: "Other",
    templates: "Templates"
  };
  return labels[category] ?? category;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}
