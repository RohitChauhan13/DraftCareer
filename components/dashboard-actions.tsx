"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resumeDataFromSections, sectionsFromResumeData } from "@/utils/resume";

type ResumeRecord = {
  id: string;
  title: string;
  templateId: string;
  isPinned: boolean;
  sections: { sectionType: string; contentJson: unknown }[];
};

export function DashboardActions({ resume }: { resume: ResumeRecord }) {
  const router = useRouter();
  const [action, setAction] = useState<"duplicate" | "delete" | "pin" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function togglePin() {
    setAction("pin");
    try {
      const response = await fetch(`/api/resumes/${resume.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPinned: !resume.isPinned })
      });
      if (!response.ok) {
        toast.error(resume.isPinned ? "Unpin failed" : "Pin failed");
        return;
      }
      toast.success(resume.isPinned ? "Unpinned" : "Pinned");
      router.refresh();
    } finally {
      setAction(null);
    }
  }

  async function duplicate() {
    setAction("duplicate");
    try {
      const data = resumeDataFromSections(resume);
      const response = await fetch("/api/resumes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: `${resume.title} Copy`,
          templateId: data.templateId,
          sections: sectionsFromResumeData({ ...data, title: `${resume.title} Copy` })
        })
      });
      if (!response.ok) {
        toast.error("Duplicate failed");
        return;
      }
      toast.success("Duplicated");
      router.refresh();
    } finally {
      setAction(null);
    }
  }

  async function remove() {
    setAction("delete");
    try {
      const response = await fetch(`/api/resumes/${resume.id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Delete failed");
        return;
      }
      toast.success("Deleted");
      setConfirmDelete(false);
      router.refresh();
    } finally {
      setAction(null);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          className={resume.isPinned ? "border-primary bg-primary/10 text-primary hover:bg-primary/15" : undefined}
          size="icon"
          variant="secondary"
          onClick={togglePin}
          title={resume.isPinned ? "Unpin resume" : "Pin resume"}
          loading={action === "pin"}
          disabled={action !== null}
        >
          <Pin size={16} fill={resume.isPinned ? "currentColor" : "none"} />
        </Button>
        <Button size="icon" variant="secondary" onClick={duplicate} title="Duplicate resume" loading={action === "duplicate"} disabled={action !== null}><Copy size={16} /></Button>
        <Button size="icon" variant="danger" onClick={() => setConfirmDelete(true)} title="Delete resume" disabled={action !== null}><Trash2 size={16} /></Button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete resume?"
        description={`This will permanently delete "${resume.title}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={action === "delete"}
        onCancel={() => {
          if (action !== "delete") setConfirmDelete(false);
        }}
        onConfirm={remove}
      />
    </>
  );
}
