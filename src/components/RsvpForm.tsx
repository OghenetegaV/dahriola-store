"use client";

import { useState } from "react";
import { ArrowRight, CalendarPlus, Download, Loader2 } from "lucide-react";
import { submitRsvp } from "@/src/app/actions/rsvp";
import { trackRsvp } from "@/src/lib/analytics";
import { motion } from "framer-motion";
import ConfettiBurst from "./events/ConfettiBurst";
import { type EventSummary, buildIcs, googleCalendarUrl } from "@/src/lib/events";

export default function RsvpForm({ event }: { event: EventSummary }) {
  const maxGuests = Math.max(0, event.maxGuests ?? 1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    guests: 0,
    source: "",
    marketingOptIn: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ ticketCode: string; alreadyRegistered?: boolean } | null>(null);

  const update = (field: keyof typeof form, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await submitRsvp({ eventId: event._id, ...form });
      if (res.success) {
        setResult({ ticketCode: res.ticketCode, alreadyRegistered: res.alreadyRegistered });
        if (!res.alreadyRegistered) trackRsvp(event.title, form.guests);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadIcs() {
    const blob = new Blob([buildIcs(event)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dahriola-event.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!event.rsvpOpen) {
    return <p className="text-sm uppercase tracking-[0.25em]">RSVPs are closed for this event.</p>;
  }

  if (result) {
    return (
      <motion.div
        className="relative text-center py-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
      >
        {!result.alreadyRegistered && <ConfettiBurst />}
        <p className="text-[10px] uppercase tracking-[0.4em] opacity-70">
          {result.alreadyRegistered ? "You're already registered" : "You're on the list"}
        </p>
        <motion.p
          className="font-display text-5xl tracking-[0.12em] mt-4 shimmer-text"
          initial={{ opacity: 0, y: 20, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.12em" }}
          transition={{ delay: 0.3, duration: 0.9 }}
        >
          {result.ticketCode}
        </motion.p>
        <p className="mt-3 text-sm opacity-80">
          Your ticket and QR code are on their way to your inbox. Show it at the door.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
          >
            <CalendarPlus size={14} /> Google Calendar
          </a>
          <button
            type="button"
            onClick={downloadIcs}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 hover:border-neutral-950"
          >
            <Download size={14} /> Apple / Outlook
          </button>
        </div>
      </motion.div>
    );
  }

  const field = "w-full bg-transparent border-b border-current/30 pb-3 text-sm focus:outline-none focus:border-current placeholder:opacity-60";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input required placeholder="Full Name" value={form.name} onChange={(e) => update("name", e.target.value)} className={field} />
      <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className={field} />
      <input type="tel" placeholder="Phone (WhatsApp)" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={field} />

      {maxGuests > 0 && (
        <select value={form.guests} onChange={(e) => update("guests", Number(e.target.value))} className={field}>
          {Array.from({ length: maxGuests + 1 }, (_, n) => (
            <option key={n} value={n} className="text-black">
              {n === 0 ? "Just me" : `Me + ${n} guest${n > 1 ? "s" : ""}`}
            </option>
          ))}
        </select>
      )}

      <select value={form.source} onChange={(e) => update("source", e.target.value)} className={field}>
        <option value="" className="text-black">How did you hear about it?</option>
        {["Instagram", "TikTok", "WhatsApp", "Friend", "Email", "Other"].map((s) => (
          <option key={s} className="text-black">{s}</option>
        ))}
      </select>

      <label className="flex items-start gap-3 text-xs opacity-80">
        <input type="checkbox" checked={form.marketingOptIn} onChange={(e) => update("marketingOptIn", e.target.checked)} className="mt-0.5" />
        Keep me updated on DAHRIOLA events, launches and offers.
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-full bg-neutral-950 text-white flex justify-center items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <>Reserve my spot <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}
