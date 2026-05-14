"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FullScreenLoader } from "@/components/page-loader";

export function NavActionLink({
  href,
  children,
  icon = false,
  className
}: {
  href: string;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <>
      {loading && <FullScreenLoader label="Opening" words={["builder", "templates", "resume", "workspace", "editor"]} />}
      <Link
        className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white", loading && "pointer-events-none opacity-80", className)}
        href={href}
        onClick={(event) => {
          event.preventDefault();
          setLoading(true);
          router.push(href);
        }}
      >
        {icon && <Plus size={16} />}
        {children}
      </Link>
    </>
  );
}
