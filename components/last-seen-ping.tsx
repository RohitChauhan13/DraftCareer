"use client";

import { useEffect } from "react";

const storageKey = "draftcareer-last-seen-ping";
const intervalMs = 5 * 60 * 1000;

export function LastSeenPing() {
  useEffect(() => {
    const lastPing = Number(localStorage.getItem(storageKey) ?? "0");
    const now = Date.now();
    if (now - lastPing < intervalMs) return;

    localStorage.setItem(storageKey, String(now));
    fetch("/api/users/last-seen", { method: "PATCH" }).catch(() => {
      localStorage.removeItem(storageKey);
    });
  }, []);

  return null;
}
