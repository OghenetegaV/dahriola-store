"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { submitRsvp } from "@/src/app/actions/rsvp";
import { trackRsvp } from "@/src/lib/analytics";
import { type EventSummary, buildIcs, googleCalendarUrl } from "@/src/lib/events";

const label = "block text-[9px] uppercase tracking-widest text-neutral-400 font-bold ml-1 mb-1.5";
const input =
  "w-full bg-neutral-50 border-none rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-1 focus:ring-neutral-300 transition-all";

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
    return (
      <p className="rounded-xl bg-neutral-50 px-5 py-4 text-sm text-neutral-500">
        RSVPs for this event are now closed.
      </p>
    );
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-beryl/10 text-brand-beryl">
          <Check size={20} strokeWidth={2} />
        </div>
        <h3 className="mt-5 font-display text-3xl tracking-[-0.03em] text-black">
          {result.alreadyRegistered ? "You're already on the list" : "You're on the list"}
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-500">
          {result.alreadyRegistered
            ? "We've sent your ticket to your inbox again."
            : "Your ticket is on its way to your inbox. Show the QR code at the door."}
        </p>

        <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-neutral-200 px-6 py-5">
          <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold">Ticket code</p>
          <p className="mt-2 font-display text-3xl tracking-[0.18em] text-black">{result.ticketCode}</p>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
          >
            Add to Google Calendar
          </a>
          <button
            type="button"
            onClick={downloadIcs}
            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-200 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900 transition hover:border-black"
          >
            Apple / Outlook
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="rsvp-name" className={label}>Full name</label>
          <input id="rsvp-name" required value={form.name} onChange={(e) => update("name", e.target.value)} className={input} placeholder="e.g. Temi Adekoya" />
        </div>
        <div>
          <label htmlFor="rsvp-phone" className={label}>Phone (WhatsApp)</label>
          <input id="rsvp-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={input} placeholder="Optional" />
        </div>
      </div>

      <div>
        <label htmlFor="rsvp-email" className={label}>Email address</label>
        <input id="rsvp-email" required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={input} placeholder="Your ticket will be sent here" />
      </div>

      <div className={`grid grid-cols-1 gap-5 ${maxGuests > 0 ? "md:grid-cols-2" : ""}`}>
        {maxGuests > 0 && (
          <div>
            <label htmlFor="rsvp-guests" className={label}>Guests</label>
            <select
              id="rsvp-guests"
              value={form.guests}
              onChange={(e) => update("guests", Number(e.target.value))}
              className={`${input} cursor-pointer appearance-none`}
            >
              {Array.from({ length: maxGuests + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Just me" : `Me + ${n} guest${n > 1 ? "s" : ""}`}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="rsvp-source" className={label}>How did you hear about it?</label>
          <select
            id="rsvp-source"
            value={form.source}
            onChange={(e) => update("source", e.target.value)}
            className={`${input} cursor-pointer appearance-none ${form.source ? "" : "text-neutral-400"}`}
          >
            <option value="">Select one</option>
            {["Instagram", "TikTok", "WhatsApp", "A friend", "Email", "Other"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 pt-1 text-[13px] leading-5 text-neutral-500">
        <input
          type="checkbox"
          checked={form.marketingOptIn}
          onChange={(e) => update("marketingOptIn", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-black"
        />
        Keep me updated on DAHRIOLA events, launches and offers.
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            Reserve my place <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  );
}
