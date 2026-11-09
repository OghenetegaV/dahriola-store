"use client";

import { Fragment, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { ArrowDown, CalendarDays, CalendarPlus, Clock, MapPin, Sparkles, Users } from "lucide-react";
import EventCountdown from "@/src/components/EventCountdown";
import RsvpForm from "@/src/components/RsvpForm";
import FestiveParticles from "./FestiveParticles";
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

function Ornament({
  left,
  length,
  size,
  color,
  delay,
  className = "",
}: {
  left: string;
  length: number;
  size: number;
  color: string;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute top-0 z-[1] flex flex-col items-center origin-top ${className}`}
      style={{ left }}
      initial={{ y: -length - size * 2 }}
      animate={{ y: 0, rotate: [-7, 7, -7] }}
      transition={{
        y: { duration: 1.4, delay: 0.4 + delay * 0.3, type: "spring", bounce: 0.45 },
        rotate: { duration: 3.6 + delay, repeat: Infinity, ease: "easeInOut", delay },
      }}
    >
      <div className="w-px bg-gradient-to-b from-transparent to-[#E8C77A]" style={{ height: length }} />
      <svg width={size} height={size * 1.18} viewBox="0 0 40 47" className="drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
        <rect x="15" y="0" width="10" height="7" rx="1.5" fill="#E8C77A" />
        <circle cx="20" cy="27" r="19" fill={color} />
        <path d="M2.5 23 Q20 33 37.5 23" stroke="#E8C77A" strokeWidth="1.8" fill="none" opacity="0.85" />
        <path d="M3 31 Q20 41 37 31" stroke="#E8C77A" strokeWidth="1" fill="none" opacity="0.5" strokeDasharray="2 3" />
        <ellipse cx="12.5" cy="19" rx="4.5" ry="6" fill="#fff" opacity="0.28" transform="rotate(-25 12.5 19)" />
      </svg>
    </motion.div>
  );
}

function GlowBlobs() {
  const reduce = useReducedMotion();
  const blobs = [
    { c: "rgba(158,27,50,0.55)", s: "48vw", top: "-10%", left: "-12%", x: [0, 80, -30, 0], y: [0, 60, 120, 0], d: 18 },
    { c: "rgba(232,199,122,0.28)", s: "38vw", top: "20%", left: "60%", x: [0, -90, 40, 0], y: [0, 80, -40, 0], d: 22 },
    { c: "rgba(46,125,91,0.45)", s: "42vw", top: "55%", left: "10%", x: [0, 60, 120, 0], y: [0, -70, 20, 0], d: 26 },
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
      className="relative mx-auto w-full max-w-md [perspective:1200px]"
    >
      {/* halo */}
      <motion.div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2rem] bg-[conic-gradient(from_0deg,#E8C77A,#9E1B32,#E8C77A,#2E7D5B,#E8C77A)] blur-2xl opacity-60"
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
          className="relative overflow-hidden rounded-2xl border border-[#E8C77A]/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]"
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
              fill={i % 3 === 0 ? "#9E1B32" : i % 3 === 1 ? "#E8C77A" : "#2E7D5B"}
            />
          );
        })}
        <circle cx="100" cy="100" r="70" fill="none" stroke="#E8C77A" strokeWidth="0.6" strokeDasharray="2 4" />
      </motion.svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`font-display shimmer-text leading-none ${day.length > 2 ? "text-6xl sm:text-7xl" : "text-7xl sm:text-8xl"}`}>
          {day}
        </span>
        <span className="mt-2 text-xs uppercase tracking-[0.5em] text-[#E8C77A]">{month}</span>
      </div>
    </motion.div>
  );
}

function Marquee({ words, reverse = false, className = "" }: { words: string[]; reverse?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const row = [...words, ...words, ...words, ...words];
  return (
    <div className={`overflow-hidden whitespace-nowrap py-4 ${className}`} aria-hidden="true">
      <motion.div
        className="inline-flex"
        animate={reduce ? undefined : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {[row, row].map((r, k) => (
          <span key={k} className="inline-flex">
            {r.map((w, i) => (
              <span key={i} className="mx-6 inline-flex items-center gap-6 font-display text-2xl md:text-3xl uppercase tracking-[0.15em]">
                {w}
                <Sparkles size={18} className="text-[#E8C77A]" />
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
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const location = eventLocation(event);
  const dayCount = eventDayCount(event);
  const words = event.title.split(" ");
  const festive = event.theme !== "default";

  const details = [
    { icon: CalendarDays, label: dayCount > 1 ? "Dates" : "Date", value: formatEventDateRange(event) },
    { icon: Clock, label: dayCount > 1 ? "Opening hours" : "Time", value: formatEventHours(event) },
    location ? { icon: MapPin, label: "Venue", value: location, href: event.mapLink } : null,
    (event.maxGuests ?? 0) > 0
      ? { icon: Users, label: "Plus-ones", value: `Bring up to ${event.maxGuests} guest${event.maxGuests! > 1 ? "s" : ""}` }
      : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string }[];

  return (
    <div className="theme-christmas event-experience relative overflow-hidden">
      {/* ================= HERO ================= */}
      <section ref={heroRef} className="relative min-h-[100svh] pt-20 flex items-center">
        <GlowBlobs />
        <FestiveParticles />

        {festive && (
          <>
            <Ornament left="6%" length={70} size={46} color="#9E1B32" delay={0} />
            <Ornament left="16%" length={130} size={30} color="#E8C77A" delay={0.6} className="hidden md:flex" />
            <Ornament left="78%" length={100} size={38} color="#2E7D5B" delay={0.3} className="hidden md:flex" />
            <Ornament left="90%" length={55} size={52} color="#9E1B32" delay={0.9} />
          </>
        )}

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-14 px-6 py-16 lg:grid-cols-[1.15fr_1fr] lg:px-12"
        >
          <div className="min-w-0">
            <motion.span
              initial={{ opacity: 0, letterSpacing: "1em" }}
              animate={{ opacity: 1, letterSpacing: "0.45em" }}
              transition={{ duration: 1.4, ease: EASE }}
              className="inline-flex items-center gap-3 rounded-full border border-[#E8C77A]/40 bg-white/5 px-4 py-2 text-[10px] uppercase text-[#E8C77A] backdrop-blur"
            >
              <motion.span
                animate={reduce ? undefined : { rotate: [0, 180, 360], scale: [1, 1.3, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex"
              >
                <Sparkles size={12} />
              </motion.span>
              {festive ? "A DAHRIOLA Christmas" : "DAHRIOLA Events"}
            </motion.span>

            <h1 className="mt-7 font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl xl:text-8xl">
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
                className="mt-6 max-w-xl text-lg md:text-2xl font-light text-[#F7F2EA]/90"
              >
                {event.tagline}
              </motion.p>
            )}

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.9 } } }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {details.slice(0, 3).map((d) => (
                <motion.span
                  key={d.label}
                  variants={fadeUp}
                  whileHover={{ y: -4, scale: 1.04 }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs sm:text-sm backdrop-blur-md"
                >
                  <d.icon size={14} className="text-[#E8C77A]" />
                  {d.icon === CalendarDays ? formatEventDateRange(event, { year: false }) : d.value}
                </motion.span>
              ))}
            </motion.div>

            {!isPast && (
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={12} className="mt-10 max-w-xl">
                <EventCountdown target={event.startDate} variant="flip" />
              </motion.div>
            )}

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={14} className="mt-10 flex flex-wrap gap-4">
              {!isPast && event.rsvpOpen && (
                <motion.a
                  href="#rsvp"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="pulse-glow group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#9E1B32] px-8 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white"
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
                  className="inline-flex items-center gap-3 rounded-full border border-[#E8C77A]/60 px-7 py-4 text-xs uppercase tracking-[0.25em] text-[#E8C77A] transition-colors hover:bg-[#E8C77A] hover:text-[#0F3D2E]"
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
        </motion.div>

        <motion.a
          href={isPast ? "#about" : "#rsvp"}
          aria-label="Scroll down"
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[#E8C77A]"
          animate={reduce ? undefined : { y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <ArrowDown size={22} />
        </motion.a>
      </section>

      {/* ================= RIBBONS ================= */}
      <div className="relative z-10 -my-4">
        <Marquee
          words={[festive ? "Christmas pop-up" : "DAHRIOLA pop-up", "Shop the collection", "Celebrate with us", "Lagos"]}
          className="-rotate-2 scale-105 bg-[#9E1B32] text-[#F7F2EA] shadow-2xl"
        />
        <Marquee
          words={["DAHRIOLA", festive ? "The festive edit" : "The new edit", "Save the date", "See you there"]}
          reverse
          className="rotate-1 scale-105 mt-3 bg-[#E8C77A] text-[#0F3D2E]"
        />
      </div>

      {/* ================= ABOUT + DETAILS ================= */}
      <section id="about" className="relative py-28">
        <FestiveParticles density={0.35} />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-2 lg:px-12">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <span className="text-[10px] uppercase tracking-[0.45em] text-[#E8C77A]">The occasion</span>
            <h2 className="mt-5 font-display text-4xl md:text-6xl leading-tight">
              Come for the fashion. <span className="italic shimmer-text">Stay for the magic.</span>
            </h2>
            {description && description.length > 0 && (
              <div className="mt-8 space-y-4 text-base leading-relaxed text-[#F7F2EA]/85 md:text-lg">
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
                    className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9E1B32] text-[#E8C77A]"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <d.icon size={22} />
                  </motion.div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#E8C77A]">{d.label}</p>
                  <p className="mt-3 font-display text-xl leading-snug">{d.value}</p>
                  {d.href && (
                    <p className="mt-4 text-xs uppercase tracking-[0.25em] text-[#E8C77A] underline-offset-4 group-hover:underline">
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
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#9E1B32] text-3xl"
                animate={reduce ? undefined : { rotate: [-8, 8, -8], y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                🎁
              </motion.div>
              <span className="text-[10px] uppercase tracking-[0.45em] text-[#E8C77A]">
                {isPast ? "That's a wrap" : "You're invited"}
              </span>
              <h2 className="mt-4 font-display text-4xl md:text-6xl">
                {isPast ? "Thank you for coming" : <span className="shimmer-text">Reserve your spot</span>}
              </h2>
              {!isPast && (
                <p className="mx-auto mt-4 max-w-md text-sm text-[#F7F2EA]/75">
                  RSVP in seconds. Your ticket, QR code and a calendar invite land straight in your inbox.
                </p>
              )}
            </div>

            <div className="mt-10">
              {isPast ? (
                <p className="text-center text-sm uppercase tracking-[0.25em] text-[#F7F2EA]/80">
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
