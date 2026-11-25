// Formatting helpers for the dashboard. Safe for server and client code.

const TZ = "Africa/Lagos";

export function naira(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

/** "3 hours ago", "yesterday", or a date for anything older than a week. */
export function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(iso);
}

/** Value for <input type="datetime-local"> showing Lagos time (UTC+1, no daylight saving). */
export function toLagosInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 3600_000);
  return d.toISOString().slice(0, 16);
}

/** Reads a datetime-local value typed as Lagos time back into an ISO timestamp. */
export function fromLagosInput(value?: string | null) {
  if (!value) return null;
  const d = new Date(`${value.length === 16 ? `${value}:00` : value}+01:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function slugify(text: string) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const STATUS_TONES: Record<string, "neutral" | "green" | "amber" | "red" | "blue" | "violet"> = {
  received: "amber",
  in_production: "violet",
  ready: "blue",
  shipped: "blue",
  out_for_delivery: "blue",
  delivered: "green",
  cancelled: "red",
};

/** Turns rows into a CSV file body that opens cleanly in Excel. */
export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const cell = (v: string | number | boolean | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    // Stop spreadsheet apps treating customer-typed text as a formula
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}
