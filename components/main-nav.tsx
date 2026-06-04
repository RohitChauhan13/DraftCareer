"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Activity, BadgeIndianRupee, FileText, Home, LayoutDashboard, LayoutTemplate, LogIn, Menu, MessageSquareHeart, UserRound, X } from "lucide-react";
import { LastSeenPing } from "@/components/last-seen-ping";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

type MainNavUser = {
  name: string;
  email: string;
  role?: string;
} | null;

export function MainNav({ user, showDonation = true }: { user: MainNavUser; showDonation?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const isLoggedIn = Boolean(user);
  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Templates", href: isLoggedIn ? "/builder/new" : "/login?reason=templates", icon: LayoutTemplate },
    ...(showDonation ? [{ label: "Donate us", href: "/donation", icon: BadgeIndianRupee }] : []),
    ...(user?.role !== "admin" ? [{ label: "Feedback", href: isLoggedIn ? "/feedback" : "/login?reason=feedback", icon: MessageSquareHeart }] : []),
    ...(user?.role === "admin" ? [{ label: "Stats", href: "/stats", icon: Activity }] : []),
    { label: "Dashboard", href: isLoggedIn ? "/dashboard" : "/login?reason=dashboard", icon: LayoutDashboard }
  ];

  useEffect(() => {
    if (!accountOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest("[role='dialog']")) {
        return;
      }
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      {user && <LastSeenPing />}
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link className="flex min-w-0 items-center gap-2 text-lg font-black tracking-normal text-foreground sm:text-2xl" href="/">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <FileText size={18} />
          </span>
          <span className="truncate">DraftCareer</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink active={isActive(pathname, item.href, item.label, searchParams.get("reason"))} href={item.href} key={item.label}>
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          {user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-sm"
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
              >
                  {initials(user.name)}
              </button>
              {accountOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-lg border border-border bg-surface p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)]" role="menu">
                <div className="flex min-w-0 items-center gap-3 rounded-md px-3 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-primary">
                    <UserRound size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{user.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                </div>
                <div className="mt-2 border-t border-border pt-2">
                  <LogoutButton />
                </div>
              </div>
              )}
            </div>
          ) : (
            <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary/90" href="/login">
              <LogIn size={16} /> Login
            </Link>
          )}
        </div>

        <details className="group relative lg:hidden">
          <summary className="list-none">
            <span className="inline-grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-border bg-surface text-foreground group-open:hidden">
              <Menu size={20} />
            </span>
            <span className="hidden h-10 w-10 cursor-pointer place-items-center rounded-md border border-border bg-surface text-foreground group-open:inline-grid">
              <X size={20} />
            </span>
          </summary>
          <div className="absolute right-0 top-12 w-[min(88vw,320px)] overflow-hidden rounded-lg border border-border bg-surface shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <div className="grid gap-1 p-2">
              {navItems.map((item) => (
                <MobileNavLink active={isActive(pathname, item.href, item.label, searchParams.get("reason"))} href={item.href} key={item.label}>
                  <item.icon size={17} /> {item.label}
                </MobileNavLink>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border p-3">
              <ThemeToggle />
              {user ? (
                <div className="grid min-w-0 flex-1 gap-2">
                  <div className="flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                      {initials(user.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{user.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                  </div>
                  <LogoutButton />
                </div>
              ) : (
                <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground" href="/login">
                  <LogIn size={16} /> Login
                </Link>
              )}
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}

function NavLink({ active, children, href }: { active: boolean; children: React.ReactNode; href: string }) {
  return (
    <Link className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition hover:bg-muted ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`} href={href}>
      {children}
    </Link>
  );
}

function MobileNavLink({ active, children, href }: { active: boolean; children: React.ReactNode; href: string }) {
  return (
    <Link className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition hover:bg-muted ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`} href={href}>
      {children}
    </Link>
  );
}

function isActive(pathname: string, href: string, label: string, reason?: string | null) {
  if (pathname === "/login" && reason) {
    return (
      (reason === "templates" && label === "Templates") ||
      (reason === "dashboard" && label === "Dashboard") ||
      (reason === "feedback" && label === "Feedback")
    );
  }
  if (href === "/login") return pathname === "/login" && label === "Login";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
  return letters.toUpperCase();
}
