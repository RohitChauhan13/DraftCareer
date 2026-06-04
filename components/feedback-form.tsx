"use client";

import { useState } from "react";
import { MessageSquareHeart, Send, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

const categories = [
  { label: "Experience", value: "experience" },
  { label: "Templates", value: "templates" },
  { label: "AI", value: "ai" },
  { label: "PDF", value: "export" },
  { label: "Bug", value: "bug" },
  { label: "Idea", value: "idea" },
  { label: "Other", value: "other" }
];

export function FeedbackForm({ userName }: { userName: string }) {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("experience");
  const [message, setMessage] = useState("");
  const [allowContact, setAllowContact] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submitFeedback() {
    if (message.trim().length < 10) {
      toast.error("Write at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allowContact, category, message, rating })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSent(true);
      setMessage("");
      toast.success("Feedback sent. Thank you!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Feedback failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <div className="relative p-8">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:30px_30px]" />
          <div className="relative">
            <div className="grid h-14 w-14 place-items-center rounded-md bg-primary text-primary-foreground">
              <MessageSquareHeart size={24} />
            </div>
            <h2 className="mt-5 text-2xl font-black">Feedback received</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Thanks, {userName}. Your feedback means a lot to us and helps make DraftCareer better for every job seeker.
            </p>
            <Button className="mt-6" type="button" variant="secondary" onClick={() => setSent(false)}>
              Send another note
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
      <div className="relative border-b border-border bg-muted/35 p-6">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:30px_30px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
              <Sparkles size={14} /> Help shape DraftCareer
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-normal sm:text-4xl">Tell us what to improve.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Quick, honest feedback helps us make resumes, AI enhancement, templates, and PDF export sharper.
            </p>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <MessageSquareHeart size={28} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[260px_1fr]">
        <section>
          <p className="text-xs font-black uppercase text-muted-foreground">Rating</p>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={`grid h-10 w-10 place-items-center rounded-md border transition ${value <= rating ? "border-amber-400 bg-amber-50 text-amber-600" : "border-border text-muted-foreground hover:bg-muted"}`}
                key={value}
                type="button"
                onClick={() => setRating(value)}
              >
                <Star fill={value <= rating ? "currentColor" : "none"} size={18} />
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs font-black uppercase text-muted-foreground">Topic</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {categories.map((item) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm font-bold transition ${category === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-muted"}`}
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block">
            <span className="text-xs font-black uppercase text-muted-foreground">Your feedback</span>
            <Textarea
              className="mt-2 min-h-44"
              maxLength={1600}
              placeholder="What felt smooth? What got confusing? What should we build next?"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input checked={allowContact} className="h-4 w-4 accent-primary" type="checkbox" onChange={(event) => setAllowContact(event.target.checked)} />
              Admin may contact me about this feedback.
            </label>
            <span className="text-xs text-muted-foreground">{message.length}/1600</span>
          </div>
          <Button className="mt-5" loading={submitting} loadingText="Sending" type="button" onClick={submitFeedback}>
            <Send size={16} /> Send feedback
          </Button>
        </section>
      </div>
    </div>
  );
}
