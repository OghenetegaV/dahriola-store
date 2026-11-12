"use client";

import { Fragment, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { ArrowDown, CalendarDays, CalendarPlus, Clock, MapPin, Sparkles, Ticket, Users } from "lucide-react";
import EventCountdown from "@/src/components/EventCountdown";
import RsvpForm from "@/src/components/RsvpForm";
import {
  type EventSummary,
  eventDayCount,
  eventLocation,
  formatEventDateRange,
  formatEventHours,
  googleCalendarUrl,
} from "@/src/lib/events";

type Props = {
  event: EventSummary;
  description?: PortableTextBlock[];
  isPast: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.1, ease: EASE } }),
};

/* ---------- decorative pieces ---------- */

function GlowBlobs() {
  const reduce = useReducedMotion();
  const blobs = [
    // Soft brand washes: sage, beryl, laurel
    { c: "rgba(178,172,136,0.32)", s: "48vw", top: "-10%", left: "-12%", x: [0, 80, -30, 0], y: [0, 60, 120, 0], d: 18 },
    { c: "rgba(119,132,114,0.20)", s: "38vw", top: "20%", left: "60%", x: [0, -90, 40, 0], y: [0, 80, -40, 0], d: 22 },
    { c: "rgba(169,186,157,0.30)", s: "42vw", top: "55%", left: "10%", x: [0, 60, 120, 0], y: [0, -70, 20, 0], d: 26 },
  ];
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ width: b.s, height: b.s, top: b.top, left: b.left, background: b.c }}
          animate={reduce ? undefined : { x: b.x, y: b.y, scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function TiltFlyer({ src, alt }: { src: string; alt: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 15 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 150, damping: 15 });
  const glareX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);
  const glare = useTransform(
    glareX,
    (x) => `linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.45) ${x}, transparent 80%)`
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: -6, y: 60 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
      transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
      className="relative mx-auto w-full max-w-md lg:max-w-[min(26rem,62vh)] [perspective:1200px]"
    >
      {/* halo */}
      <motion.div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2rem] bg-[conic-gradient(from_0deg,#B2AC88,#778472,#A9BA9D,#E8E4DA,#B2AC88)] blur-2xl opacity-50"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        animate={reduce ? undefined : { y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          onPointerMove={(e) => {
            if (reduce) return;
            const r = e.currentTarget.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width - 0.5);
            my.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onPointerLeave={() => {
            mx.set(0);
            my.set(0);
          }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative overflow-hidden rounded-2xl border border-white shadow-[0_40px_80px_-25px_rgba(30,30,25,0.35)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="block w-full h-auto" />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{ background: glare }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** Shown when no flyer has been uploaded: a spinning wreath with the date in it. */
function DateWreath({ event }: { event: EventSummary }) {
  const reduce = useReducedMotion();
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleDateString("en-GB", { ...o, timeZone: "Africa/Lagos" });
  const firstDay = fmt(event.startDate, { day: "numeric" });
  const lastDay = fmt(event.endDate, { day: "numeric" });
  const day = eventDayCount(event) > 1 && firstDay !== lastDay ? `${firstDay}–${lastDay}` : firstDay;
  const month = fmt(event.startDate, { month: "long" });
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
      className="relative mx-auto aspect-square w-full max-w-sm"
    >
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const r = 82 + (i % 2) * 8;
          return (
            <circle
              key={i}
              cx={(100 + Math.cos(a) * r).toFixed(2)}
              cy={(100 + Math.sin(a) * r).toFixed(2)}
              r={i % 3 === 0 ? 5 : 3}
              fill={i % 3 === 0 ? "#778472" : i % 3 === 1 ? "#B2AC88" : "#A9BA9D"}
            />
          );
        })}
        <circle cx="100" cy="100" r="70" fill="none" stroke="#778472" strokeWidth="0.6" strokeDasharray="2 4" />
      </motion.svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`font-display shimmer-text leading-none ${day.length > 2 ? "text-6xl sm:text-7xl" : "text-7xl sm:text-8xl"}`}>
          {day}
        </span>
        <span className="mt-2 text-xs uppercase tracking-[0.5em] text-brand-beryl">{month}</span>
      </div>
    </motion.div>
  );
}

function Marquee({ words, reverse = false, className = "" }: { words: string[]; reverse?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const row = [...words, ...words, ...words, ...words];
  return (
    <div className={`overflow-hidden whitespace-nowrap py-2.5 ${className}`} aria-hidden="true">
      <motion.div
        className="inline-flex"
        animate={reduce ? undefined : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      >
        {[row, row].map((r, k) => (
          <span key={k} className="inline-flex">
            {r.map((w, i) => (
              <span key={i} className="mx-5 inline-flex items-center gap-5 font-display text-sm md:text-base uppercase tracking-[0.3em]">
                {w}
                <Sparkles size={12} className="opacity-60" />
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------- page ---------- */

export default function EventExperience({ event, description, isPast }: Props) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  const location = eventLocation(event);
  const dayCount = eventDayCount(event);
  // The embedded map searches by address (the venue name alone can match the wrong place)
  const mapQuery = event.venueAddress || location;
  const directionsUrl =
    event.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;
  const words = event.title.split(" ");

  const details = [
    { icon: CalendarDays, label: dayCount > 1 ? "Dates" : "Date", value: formatEventDateRange(event) },
    { icon: Clock, label: dayCount > 1 ? "Opening hours" : "Time", value: formatEventHours(event) },
    location ? { icon: MapPin, label: "Venue", value: location, href: event.mapLink } : null,
    (event.maxGuests ?? 0) > 0
      ? { icon: Users, label: "Plus-ones", value: `Bring up to ${event.maxGuests} guest${event.maxGuests! > 1 ? "s" : ""}` }
      : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string }[];

  return (
    <div className="event-experience relative overflow-hidden">
      {/* ================= HERO ================= */}
      <section ref={heroRef} className="relative min-h-[100svh] pt-20 flex items-center">
        <GlowBlobs />

        <div
          className="relative z-10 mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-14 px-6 py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-12 lg:py-10"
        >
          <div className="min-w-0">
            <motion.span
              initial={{ opacity: 0, letterSpacing: "1em" }}
              animate={{ opacity: 1, letterSpacing: "0.45em" }}
              transition={{ duration: 1.4, ease: EASE }}
              className="inline-flex items-center gap-3 rounded-full border border-neutral-300 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase text-brand-beryl backdrop-blur"
            >
              <motion.span
                animate={reduce ? undefined : { rotate: [0, 180, 360], scale: [1, 1.3, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex"
              >
                <Sparkles size={12} />
              </motion.span>
              {"DAHRIOLA Events"}
            </motion.span>

            <h1 className="mt-7 font-display tracking-[-0.03em] text-[2.6rem] leading-[1.05] sm:text-6xl lg:mt-5 lg:text-[3.6rem] lg:leading-[1.02] xl:text-[4.1rem]">
              {words.map((w, i) => (
                <Fragment key={i}>
                <span className="inline-block max-w-full overflow-hidden pb-2 align-bottom">
                  <motion.span
                    className="inline-block shimmer-text"
                    initial={{ y: "110%", rotate: 8 }}
                    animate={{ y: "0%", rotate: 0 }}
                    transition={{ duration: 0.9, delay: 0.25 + i * 0.09, ease: EASE }}
                  >
                    {w}
                  </motion.span>
                </span>{" "}
                </Fragment>
              ))}
            </h1>

            {event.tagline && (
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={words.length * 0.9 + 3}
                className="mt-6 max-w-xl text-lg md:text-2xl lg:mt-3 lg:text-xl font-light text-neutral-600"
              >
                {event.tagline}
              </motion.p>
            )}

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.9 } } }}
              className="mt-8 flex flex-wrap gap-3 lg:mt-5 lg:gap-2"
            >
              {details.slice(0, 3).map((d) => (
                <motion.span
                  key={d.label}
                  variants={fadeUp}
                  whileHover={{ y: -4, scale: 1.04 }}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-700 shadow-sm sm:text-sm"
                >
                  <d.icon size={14} className="text-brand-beryl" />
                  {d.icon === CalendarDays ? formatEventDateRange(event, { year: false }) : d.value}
                </motion.span>
              ))}
            </motion.div>

            {!isPast && (
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={12} className="mt-10 max-w-xl lg:mt-6 lg:max-w-lg">
                <EventCountdown target={event.startDate} variant="flip" />
              </motion.div>
            )}

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={14} className="mt-10 flex flex-wrap gap-4 lg:mt-6">
              {!isPast && event.rsvpOpen && (
                <motion.a
                  href="#rsvp"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="pulse-glow group relative inline-flex h-12 items-center gap-3 overflow-hidden rounded-full bg-neutral-950 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
                >
                  <span className="shine absolute inset-0" aria-hidden="true" />
                  <span className="relative">Reserve my spot</span>
                  <ArrowDown size={16} className="relative transition-transform group-hover:translate-y-1" />
                </motion.a>
              )}
              {!isPast && (
                <motion.a
                  href={googleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex h-12 items-center gap-3 rounded-full border border-neutral-300 bg-white/60 px-7 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 transition-colors hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                >
                  <CalendarPlus size={16} /> Add to calendar
                </motion.a>
              )}
            </motion.div>
          </div>

          <div className="relative">
            {event.flyerUrl ? (
              <TiltFlyer src={`${event.flyerUrl}?w=1000&fit=max&auto=format`} alt={`${event.title} flyer`} />
            ) : (
              <DateWreath event={event} />
            )}
          </div>
        </div>

        <motion.a
          href={isPast ? "#about" : "#rsvp"}
          aria-label="Scroll down"
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-brand-beryl"
          animate={reduce ? undefined : { y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <ArrowDown size={22} />
        </motion.a>
      </section>

      {/* ================= RIBBONS ================= */}
      <div className="relative z-10">
        <Marquee
          words={["DAHRIOLA pop-up", "Shop the collection", "Celebrate with us", "Lagos"]}
          className="-rotate-1 scale-105 bg-neutral-950 text-white/85"
        />
        <Marquee
          words={["DAHRIOLA", "Ready to wear", "Bespoke", "See you there"]}
          reverse
          className="rotate-[0.5deg] scale-105 mt-2 bg-brand-beryl/15 text-brand-beryl"
        />
      </div>

      {/* ================= ABOUT + DETAILS ================= */}
      <section id="about" className="relative py-28">
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-2 lg:px-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-[10px] uppercase tracking-[0.45em] text-brand-beryl">The occasion</span>
            <h2 className="mt-5 font-display text-4xl tracking-[-0.03em] md:text-6xl leading-tight">
              Come for the fashion. <span className="italic shimmer-text">Stay for the magic.</span>
            </h2>
            {description && description.length > 0 && (
              <div className="mt-8 space-y-4 text-base leading-relaxed text-neutral-600 md:text-lg">
                <PortableText value={description} />
              </div>
            )}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ show: { transition: { staggerChildren: 0.15 } } }}
            className="grid gap-5 sm:grid-cols-2"
          >
            {details.map((d) => {
              const card = (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 50, rotate: -3 },
                    show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.8, ease: EASE } },
                  }}
                  whileHover={{ y: -8, rotate: -1 }}
                  className="detail-card group relative h-full overflow-hidden rounded-3xl p-7"
                >
                  <motion.div
                    className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-beryl/10 text-brand-beryl"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <d.icon size={22} />
                  </motion.div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-brand-beryl">{d.label}</p>
                  <p className="mt-3 font-display text-xl leading-snug">{d.value}</p>
                  {d.href && (
                    <p className="mt-4 text-xs uppercase tracking-[0.25em] text-brand-beryl underline-offset-4 group-hover:underline">
                      Get directions →
                    </p>
                  )}
                </motion.div>
              );
              return d.href ? (
                <a key={d.label} href={d.href} target="_blank" rel="noopener noreferrer" className="block">
                  {card}
                </a>
              ) : (
                <div key={d.label}>{card}</div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================= MAP ================= */}
      {mapQuery && (
        <section id="map" className="relative pb-24">
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
              className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
            >
              <div>
                <span className="text-[10px] uppercase tracking-[0.45em] text-brand-beryl">Find us</span>
                <h2 className="mt-4 font-display text-3xl md:text-5xl">{event.venueName || "The venue"}</h2>
                {event.venueAddress && (
                  <p className="mt-3 flex items-start gap-2 text-sm md:text-base text-neutral-600">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-brand-beryl" />
                    {event.venueAddress}
                  </p>
                )}
              </div>
              <motion.a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-neutral-950 px-7 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white md:self-auto"
              >
                <MapPin size={16} /> Get directions
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1, ease: EASE }}
              className="mt-10 overflow-hidden rounded-3xl border border-neutral-200 shadow-[0_40px_80px_-40px_rgba(30,30,25,0.35)]"
            >
              <iframe
                title={`Map to ${event.venueName || event.venueAddress}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
                className="block h-[340px] w-full md:h-[440px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* ================= RSVP ================= */}
      <section id="rsvp" className="relative scroll-mt-24 pb-32 pt-10">
        <GlowBlobs />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1, ease: EASE }}
            className="glow-border p-8 md:p-14"
          >
            <div className="text-center">
              <motion.div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950 text-white"
                animate={reduce ? undefined : { rotate: [-6, 6, -6], y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <Ticket size={26} strokeWidth={1.5} />
              </motion.div>
              <span className="text-[10px] uppercase tracking-[0.45em] text-brand-beryl">
                {isPast ? "That's a wrap" : "You're invited"}
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-6xl">
                {isPast ? "Thank you for coming" : <span className="shimmer-text">Reserve your spot</span>}
              </h2>
              {!isPast && (
                <p className="mx-auto mt-4 max-w-md text-sm text-neutral-500">
                  RSVP in seconds. Your ticket, QR code and a calendar invite land straight in your inbox.
                </p>
              )}
            </div>

            <div className="mt-10">
              {isPast ? (
                <p className="text-center text-sm uppercase tracking-[0.25em] text-neutral-600">
                  This event has ended. Thank you to everyone who came.
                </p>
              ) : (
                <RsvpForm event={event} />
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
