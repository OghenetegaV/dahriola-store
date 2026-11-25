"use client";

// The bell in the dashboard. Shows what's new (orders, reviews to approve,
// RSVPs) and checks for more every minute while the dashboard is open.
// "Seen" is remembered on this device.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ShoppingBag, Star } from "lucide-react";
import { loadActivity } from "@/src/app/admin/actions/notifications";
import type { ActivityItem } from "@/src/lib/admin/activity";
import { cx } from "@/src/components/admin/ui";

const SEEN_KEY = "dahriola-admin-seen-at";
const SEEN_EVENT = "dahriola-admin-seen";
const CHECK_EVERY = 60_000;

const ICONS = { order: ShoppingBag, review: Star, rsvp: CalendarDays };

function subscribe(onChange: () => void) {
  window.addEventListener(SEEN_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SEEN_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) || "";
  } catch {
    return "";
  }
};

function ago(iso: string, now: number) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function NotificationBell({ initial, align = "left" }: { initial: ActivityItem[]; align?: "left" | "right" }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date().getTime());
  // What was unread at the moment the panel was opened, so those rows stay highlighted while it's open
  const [seenWhenOpened, setSeenWhenOpened] = useState("");
  const box = useRef<HTMLDivElement>(null);
  // null on the server and until the browser has loaded, so nothing flashes as "new"
  const seen = useSyncExternalStore<string | null>(subscribe, readSeen, () => null);

  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const fresh = await loadActivity();
        if (fresh) setItems(fresh);
        setNow(new Date().getTime());
      } catch {}
    };
    const timer = setInterval(check, CHECK_EVERY);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const unread = seen === null ? 0 : items.filter((i) => i.at > seen).length;

  // Show the count in the browser tab too, so it's visible from another tab
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unread ? `(${unread}) ${base}` : base;
  }, [unread]);

  function toggle() {
    if (!open) {
      setSeenWhenOpened(seen || "");
      setNow(new Date().getTime());
      try {
        localStorage.setItem(SEEN_KEY, new Date().toISOString());
      } catch {}
      window.dispatchEvent(new Event(SEEN_EVENT));
    }
    setOpen(!open);
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <Bell size={19} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cx(
            "absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">What&apos;s new</p>
            <p className="text-xs text-neutral-500">Orders, reviews and RSVPs from the last 2 weeks</p>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">Nothing new yet. You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-neutral-100 overflow-y-auto">
              {items.map((item) => {
                const Icon = ICONS[item.kind];
                const fresh = item.at > seenWhenOpened;
                return (
                  <li key={item.id}>
                    <Link href={item.href} onClick={() => setOpen(false)} className={cx("flex gap-3 px-4 py-3 hover:bg-neutral-50", fresh && "bg-brand-beryl/10")}>
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                        <Icon size={15} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[13px] font-medium text-neutral-900">
                          {item.title}
                          {fresh && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" aria-label="New" />}
                        </span>
                        <span className="block truncate text-[13px] text-neutral-600">{item.detail}</span>
                        <span className="block text-[11px] text-neutral-400">{ago(item.at, now)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
