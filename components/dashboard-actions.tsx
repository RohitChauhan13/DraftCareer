"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resumeDataFromSections, sectionsFromResumeData } from "@/utils/resume";

type ResumeRecord = {
  id: string;
  title: string;
  templateId: string;
  sections: { sectionType: string; contentJson: unknown }[];
};

export function DashboardActions({ resume }: { resume: ResumeRecord }) {
  const router = useRouter();
  const [action, setAction] = useState<"duplicate" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        toast.error("Unable to duplicate resume");
        return;
      }
      toast.success("Resume duplicated");
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
        toast.error("Unable to delete resume");
        return;
      }
      toast.success("Resume deleted");
      setConfirmDelete(false);
      router.refresh();
    } finally {
      setAction(null);
    }
  }

  return (
    <>
      <div className="flex gap-2">
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
