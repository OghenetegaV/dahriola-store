"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import EventCountdown from "./EventCountdown";
import { trackSelectPromotion, trackViewPromotion } from "@/src/lib/analytics";
import { type EventSummary, formatEventDate, formatEventTime } from "@/src/lib/events";

const SNOOZE_MS = 2 * 24 * 60 * 60 * 1000; // don't auto-open again for 2 days after closing

export default function EventPopup({ event }: { event: EventSummary }) {
  const [isOpen, setIsOpen] = useState(false);
  const closedKey = `dahriola-event-closed-${event._id}`;
  const festive = event.theme !== "default";

  useEffect(() => {
    let closedAt = 0;
    try {
      closedAt = Number(localStorage.getItem(closedKey) || 0);
    } catch {}
    if (Date.now() - closedAt < SNOOZE_MS) return;
    if (window.location.pathname.startsWith(`/events/${event.slug}`)) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      trackViewPromotion(event._id, event.title);
    }, 4000);
    return () => clearTimeout(timer);
  }, [closedKey, event.slug, event._id, event.title]);

  const close = () => {
    try {
      localStorage.setItem(closedKey, String(Date.now()));
    } catch {}
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto" role="dialog" aria-modal="true" aria-label={event.title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          <div className="relative min-h-screen flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`${festive ? "theme-christmas" : "bg-white text-black"} relative rounded-2xl w-full max-w-[950px] flex flex-col md:flex-row overflow-hidden`}
            >
              {festive && <div className="snowfall" aria-hidden="true" />}

              <button
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 z-50 bg-white text-black rounded-full p-2"
              >
                <X size={18} />
              </button>

              {event.flyerUrl && (
                <div className="relative w-full md:w-1/2 bg-black/20 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${event.flyerUrl}?w=900&fit=max&auto=format`}
                    alt={`${event.title} flyer`}
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}

              <div className={`relative w-full ${event.flyerUrl ? "md:w-1/2" : ""} p-6 md:p-12 flex flex-col justify-center`}>
                <span className="text-[9px] tracking-[0.4em] uppercase festive-accent">
                  {festive ? "A DAHRIOLA Christmas" : "DAHRIOLA Events"}
                </span>

                <h2 className="mt-5 font-display text-4xl leading-tight">
                  {event.tagline || "Something exciting is coming to Lagos!"}
                </h2>

                <p className="mt-4 text-sm uppercase tracking-[0.2em] opacity-80">
                  {formatEventDate(event.startDate)} · {formatEventTime(event.startDate)}
                </p>

                <EventCountdown target={event.startDate} className="mt-8" />

                <Link
                  href={`/events/${event.slug}`}
                  onClick={() => {
                    trackSelectPromotion(event._id, event.title);
                    close();
                  }}
                  className="festive-btn mt-8 w-full py-4 flex justify-center items-center gap-3 text-xs uppercase tracking-[0.25em]"
                >
                  RSVP now <ArrowRight size={16} />
                </Link>

                <button onClick={close} className="mt-4 text-xs uppercase tracking-[0.25em] opacity-70 hover:opacity-100">
                  Maybe later
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
