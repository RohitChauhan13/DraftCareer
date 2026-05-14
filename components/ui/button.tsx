import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
  loadingText?: string;
};

export function Button({
  className,
  children,
  disabled,
  loading = false,
  loadingText,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "border-border bg-white text-foreground hover:bg-muted/60",
        variant === "ghost" && "border-transparent bg-transparent text-foreground hover:bg-muted/70",
        variant === "danger" && "border-destructive bg-destructive text-white hover:bg-destructive/90",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === "icon" ? 17 : 16} />}
      {size === "icon" ? (loading ? <span className="sr-only">{loadingText ?? "Loading"}</span> : children) : loadingText && loading ? loadingText : children}
    </button>
  );
}
