"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  target: string; // ISO date
  variant?: "boxes" | "inline" | "flip" | "minimal" | "urgent";
  className?: string;
  size?: "md" | "lg"; // urgent variant only
};

function remaining(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    done: diff === 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function EventCountdown({ target, variant = "boxes", className = "", size = "md" }: Props) {
  // Rendered only after mount so server and client markup match
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    const tick = () => setTime(remaining(target));
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [target]);

  if (!time) {
    return (
      <div
        className={className}
        aria-hidden="true"
        style={{ minHeight: variant === "flip" ? 110 : variant === "urgent" ? (size === "lg" ? 130 : 92) : variant === "minimal" ? 58 : variant === "boxes" ? 64 : 16 }}
      />
    );
  }

  if (time.done) {
    return <p className={className}>Happening now</p>;
  }

  if (variant === "inline") {
    return (
      <span className={className}>
        {time.days}d {String(time.hours).padStart(2, "0")}h {String(time.minutes).padStart(2, "0")}m
      </span>
    );
  }

  // Loud, for dark backgrounds: big glowing numbers in dark tiles, with the
  // seconds picked out in green so the clock visibly runs down
  if (variant === "urgent") {
    const units = [
      { label: "Days", value: time.days },
      { label: "Hours", value: time.hours },
      { label: "Mins", value: time.minutes },
      { label: "Secs", value: time.seconds, live: true },
    ];
    const lg = size === "lg";
    return (
      <div
        className={`grid grid-cols-4 ${lg ? "gap-3" : "gap-2"} ${className}`}
        role="timer"
        aria-label={`${time.days} days ${time.hours} hours ${time.minutes} minutes to go`}
      >
        {units.map((u) => {
          const text = String(u.value).padStart(2, "0");
          return (
            <div
              key={u.label}
              className={`relative overflow-hidden border text-center ${
                u.live ? "border-[#7CF29A]/40 bg-[#7CF29A]/[0.07]" : "border-white/10 bg-white/[0.06]"
              } ${lg ? "rounded-2xl px-2 pb-5 pt-6" : "rounded-xl px-1 py-4"}`}
            >
              {/* Faint sheen across the top half, like a flip-clock leaf */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent" />
              <div
                className={`relative overflow-hidden font-display leading-none tracking-[-0.02em] tabular-nums ${
                  lg ? "h-[4.25rem] text-[4.25rem]" : "h-[2.6rem] text-[2.6rem]"
                } ${u.live ? "text-[#7CF29A]" : "text-white"}`}
                style={{ textShadow: u.live ? "0 0 22px rgba(124,242,154,0.75)" : "0 0 18px rgba(124,242,154,0.45)" }}
              >
                <AnimatePresence initial={false}>
                  <motion.span
                    key={text}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ y: "-70%", opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: "70%", opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {text}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className={`relative font-bold uppercase text-white/55 ${lg ? "mt-3.5 text-[10px] tracking-[0.3em]" : "mt-2.5 text-[9px] tracking-[0.25em]"}`}>
                {u.label}
              </div>
              {/* The seconds tile drains a green bar each second */}
              {u.live && (
                <motion.div
                  key={`bar-${text}`}
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[3px] bg-[#7CF29A] shadow-[0_0_12px_rgba(124,242,154,0.9)]"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Quiet, typographic: serif numbers separated by hairlines
  if (variant === "minimal") {
    const units = [
      { label: "Days", value: time.days },
      { label: "Hours", value: time.hours },
      { label: "Min", value: time.minutes },
      { label: "Sec", value: time.seconds },
    ];
    return (
      <div
        className={`flex divide-x divide-neutral-200 ${className}`}
        role="timer"
        aria-label={`${time.days} days ${time.hours} hours ${time.minutes} minutes to go`}
      >
        {units.map((u) => (
          <div key={u.label} className="flex-1 px-3 text-center first:pl-0 last:pr-0">
            <div className="font-display text-3xl leading-none tracking-[-0.02em] text-black tabular-nums">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-neutral-400">{u.label}</div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "flip") {
    const flipUnits = [
      { label: "Days", value: time.days },
      { label: "Hours", value: time.hours },
      { label: "Minutes", value: time.minutes },
      { label: "Seconds", value: time.seconds },
    ];
    return (
      <div
        className={`grid grid-cols-4 gap-2 sm:gap-4 ${className}`}
        role="timer"
        aria-label={`${time.days} days ${time.hours} hours ${time.minutes} minutes to go`}
      >
        {flipUnits.map((u) => {
          const text = String(u.value).padStart(2, "0");
          return (
            <div key={u.label} className="flip-tile relative min-w-0 overflow-hidden rounded-2xl text-center py-4 sm:py-6 lg:py-4">
              <div className="relative h-[1.1em] font-display text-3xl sm:text-5xl lg:text-[2.6rem] leading-none tabular-nums overflow-hidden">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={text}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ y: "-100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {text}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-2 text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-70">{u.label}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Mins", value: time.minutes },
    { label: "Secs", value: time.seconds },
  ];

  return (
    <div className={`flex gap-2 ${className}`} role="timer" aria-label={`${time.days} days ${time.hours} hours ${time.minutes} minutes to go`}>
      {units.map((u) => (
        <div key={u.label} className="countdown-box flex-1 min-w-[56px] text-center py-3 px-2">
          <div className="font-display text-2xl md:text-3xl leading-none tabular-nums">
            {String(u.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.25em] opacity-70">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
