"use client";

import { useEffect, useState } from "react";

type Props = {
  target: string; // ISO date
  variant?: "boxes" | "inline";
  className?: string;
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

export default function EventCountdown({ target, variant = "boxes", className = "" }: Props) {
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
    return <div className={className} aria-hidden="true" style={{ minHeight: variant === "boxes" ? 64 : 16 }} />;
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
