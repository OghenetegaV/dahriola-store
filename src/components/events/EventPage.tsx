"use client";

// Upcoming event page (dahriola.com/rsvp leads here). Deliberately quiet:
// it follows the Our Story / Bespoke pages — stone background, large serif
// title, a framed image beside a white content card, and one gentle fade-in.
import { motion, type HTMLMotionProps } from "framer-motion";
import RichText, { hasRichText } from "@/src/components/RichText";
import { ArrowUpRight } from "lucide-react";
import EventCountdown from "@/src/components/EventCountdown";
import RsvpForm from "@/src/components/RsvpForm";
import {
  type EventSummary,
  eventDayCount,
  formatEventDateRange,
  formatEventHours,
  googleCalendarUrl,
} from "@/src/lib/events";
import { imageUrl } from "@/src/lib/images";

const EASE = [0.22, 1, 0.36, 1] as const;

function FadeIn({ delay = 0, inView = false, ...props }: HTMLMotionProps<"div"> & { delay?: number; inView?: boolean }) {
  const motionProps = inView
    ? { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
  return <motion.div {...motionProps} transition={{ duration: 0.7, delay, ease: EASE }} {...props} />;
}

const Diamond = () => <span aria-hidden="true" className="hidden h-1 w-1 rotate-45 bg-brand-beryl sm:block" />;

const card = "rounded-[2rem] border border-neutral-100 bg-white shadow-[0_30px_90px_-70px_rgba(0,0,0,0.5)]";
const eyebrow = "text-[10px] font-bold uppercase tracking-[0.35em] text-brand-beryl";

export default function EventPage({ event, description }: { event: EventSummary; description?: string | null }) {
  const multiDay = eventDayCount(event) > 1;
  const area = (event.venueAddress || "").split(",").slice(-2).join(",").trim() || "Lagos";
  const mapQuery = event.venueAddress || event.venueName || "";
  const directionsUrl =
    event.mapLink || (mapQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}` : "");

  const details = [
    { label: multiDay ? "Dates" : "Date", value: formatEventDateRange(event) },
    { label: multiDay ? "Hours" : "Time", value: formatEventHours(event) },
    {
      label: "Venue",
      value: [event.venueName, event.venueAddress].filter(Boolean).join(", ") || "Lagos, to be announced",
      link: directionsUrl ? { href: directionsUrl, text: "Get directions" } : undefined,
    },
    ...((event.maxGuests ?? 0) > 0
      ? [{ label: "Guests", value: `You can bring up to ${event.maxGuests} guest${event.maxGuests! > 1 ? "s" : ""}` }]
      : []),
  ];

  return (
    <main className="bg-[#fbfaf7] text-neutral-900">
      {/* ── Phones: flyer edge to edge, then the countdown and buttons ── */}
      <section className="pt-20 lg:hidden">
        <h1 className="sr-only">{event.title}</h1>
        {event.flyerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(event.flyerUrl, { width: 1100 })} alt={`${event.title} flyer`} className="block h-auto w-full" />
        ) : (
          <div className="flex aspect-[4/5] flex-col items-center justify-center bg-[#F2F0ED] px-5 text-center">
            <p className={eyebrow}>Save the date</p>
            <p className="mt-4 font-display text-5xl tracking-[-0.04em] text-black">{event.title}</p>
            <p className="mt-4 font-display text-3xl tracking-[-0.03em] text-neutral-700">
              {formatEventDateRange(event, { weekday: false, year: false })}
            </p>
          </div>
        )}

        <div className="relative overflow-hidden bg-[#0b0d0c] px-5 pb-9 pt-8 text-white">
          {/* A soft green glow, picking up the light in the flyer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[130%] -translate-x-1/2 rounded-[50%] opacity-60 blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(124,242,154,0.55), transparent)" }}
          />
          <div className="relative mx-auto max-w-md">
            <p className="flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.35em] text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7CF29A] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7CF29A]" />
              </span>
              Doors open in
            </p>
            <EventCountdown target={event.startDate} variant="urgent" className="mt-5 text-center font-display text-3xl text-[#7CF29A]" />
            <p className="mt-5 text-center text-[10px] font-bold uppercase leading-5 tracking-[0.28em] text-white/60">
              {formatEventDateRange(event, { weekday: false })} · {formatEventHours(event).replace(" daily", "")}
              <br />
              {area}
            </p>

            <div className="mt-7 flex flex-col gap-3">
              {event.rsvpOpen && (
                <a
                  href="#rsvp"
                  className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#7CF29A] px-8 text-[12px] font-bold uppercase tracking-[0.2em] text-black shadow-[0_0_34px_-6px_rgba(124,242,154,0.8)] transition active:scale-[0.98]"
                >
                  Reserve your place
                </a>
              )}
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[52px] w-full items-center justify-center rounded-full border border-white/25 px-8 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition active:scale-[0.98]"
              >
                Add to calendar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Header (larger screens) ── */}
      <section className="hidden px-5 pb-12 pt-32 md:px-8 md:pb-16 md:pt-40 lg:block">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="mx-auto mb-5 flex h-9 w-9 items-center justify-center">
              <span className="block h-2 w-2 rounded-full bg-brand-beryl" />
            </div>
            <p className={`${eyebrow} mb-5 tracking-[0.45em]`}>DAHRIOLA Events</p>
            <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.04em] text-black md:text-7xl lg:text-8xl">
              {event.title}
            </h1>
          </FadeIn>

          <FadeIn delay={0.12}>
            {event.tagline && <p className="mx-auto mt-6 max-w-xl text-[15px] leading-7 text-neutral-500 md:text-base">{event.tagline}</p>}

            <div className="mt-8 flex flex-col items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500 sm:flex-row sm:gap-4">
              <span>{formatEventDateRange(event, { weekday: false })}</span>
              <Diamond />
              <span>{formatEventHours(event).replace(" daily", "")}</span>
              <Diamond />
              <span>{area}</span>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {event.rsvpOpen && (
                <a
                  href="#rsvp"
                  className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full bg-black px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
                >
                  Reserve your place
                </a>
              )}
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border border-neutral-200 bg-white px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 transition hover:border-black"
              >
                Add to calendar
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Flyer + details / RSVP ── */}
      <section className="px-5 pb-20 pt-8 md:px-8 md:pb-28 lg:pt-0">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-16">
          <aside className="hidden lg:col-span-5 lg:block">
            <FadeIn delay={0.2} className="lg:sticky lg:top-28">
              {event.flyerUrl ? (
                <div className="overflow-hidden rounded-[2rem] bg-neutral-100 shadow-[0_35px_90px_-50px_rgba(0,0,0,0.55)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(event.flyerUrl, { width: 1100 })} alt={`${event.title} flyer`} className="block h-auto w-full" />
                </div>
              ) : (
                <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-[2rem] bg-[#F2F0ED] text-center">
                  <p className={eyebrow}>Save the date</p>
                  <p className="mt-4 font-display text-6xl tracking-[-0.04em] text-black">
                    {formatEventDateRange(event, { weekday: false, year: false })}
                  </p>
                </div>
              )}

              <div className={`${card} mt-6 px-6 py-6 md:px-8`}>
                <p className="mb-5 text-center text-[9px] font-bold uppercase tracking-widest text-neutral-400">Doors open in</p>
                <EventCountdown target={event.startDate} variant="minimal" />
              </div>
            </FadeIn>
          </aside>

          <div className="space-y-6 lg:col-span-7">
            <FadeIn delay={0.28} className={`${card} p-6 md:p-10 lg:p-12`}>
              <p className={eyebrow}>The details</p>
              <dl className="mt-6">
                {details.map((d) => (
                  <div key={d.label} className="grid grid-cols-1 gap-1 border-b border-neutral-100 py-5 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[130px_1fr] sm:gap-6">
                    <dt className="pt-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-400">{d.label}</dt>
                    <dd className="text-[15px] leading-7 text-neutral-800">
                      {d.value}
                      {d.link && (
                        <a
                          href={d.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex w-fit items-center gap-1 text-[13px] text-brand-beryl underline-offset-4 hover:underline"
                        >
                          {d.link.text} <ArrowUpRight size={13} />
                        </a>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              {hasRichText(description) && (
                <div className="mt-10 border-t border-neutral-100 pt-10">
                  <div className="space-y-6 text-[15px] leading-8 text-neutral-700 md:text-[16px]">
                    <RichText value={description} />
                  </div>
                </div>
              )}
            </FadeIn>

            <FadeIn inView id="rsvp" className={`${card} scroll-mt-28 p-6 md:p-10 lg:p-12`}>
              <p className={eyebrow}>RSVP</p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] text-black md:text-5xl">Reserve your place</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
                Register below and we&apos;ll email your ticket and a calendar invite straight away.
              </p>
              <div className="mt-8">
                <RsvpForm event={event} />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Map ── */}
      {mapQuery && (
        <section className="px-5 pb-24 md:px-8 md:pb-32">
          <FadeIn inView className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={eyebrow}>Getting there</p>
                <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] text-black md:text-5xl">{event.venueName || area}</h2>
                {event.venueAddress && <p className="mt-3 text-[15px] text-neutral-500">{event.venueAddress}</p>}
              </div>
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-fit items-center gap-2 rounded-full border border-neutral-200 bg-white px-7 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 transition hover:border-black"
                >
                  Open in Maps <ArrowUpRight size={14} />
                </a>
              )}
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-neutral-100 bg-neutral-100 shadow-[0_35px_90px_-60px_rgba(0,0,0,0.5)]">
              <iframe
                title={`Map to ${event.venueName || event.venueAddress}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
                className="block h-[360px] w-full grayscale-[35%] md:h-[460px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </FadeIn>
        </section>
      )}
    </main>
  );
}
