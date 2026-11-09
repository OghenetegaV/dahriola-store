"use client";

// One-off confetti explosion from the centre of its (relative) parent.
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Deterministic pseudo-random (keeps render pure)
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const COLORS = ["#E8C77A", "#9E1B32", "#F7F2EA", "#C9A24E", "#D94A64", "#2E7D5B"];

export default function ConfettiBurst({ pieces = 70 }: { pieces?: number }) {
  const reduce = useReducedMotion();

  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => {
        const angle = (Math.PI * 2 * i) / pieces + rand(i * 7 + 1) * 0.5;
        const distance = 120 + rand(i * 7 + 2) * 220;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 80,
          fall: 180 + rand(i * 7 + 3) * 160,
          rotate: rand(i * 7 + 4) * 720 - 360,
          color: COLORS[i % COLORS.length],
          w: 6 + rand(i * 7 + 5) * 6,
          round: rand(i * 7 + 6) > 0.6,
          delay: rand(i * 7 + 7) * 0.15,
        };
      }),
    [pieces]
  );

  if (reduce) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute left-1/2 top-1/3 block"
          style={{
            width: b.w,
            height: b.round ? b.w : b.w / 2.2,
            background: b.color,
            borderRadius: b.round ? "9999px" : 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{
            x: [0, b.x, b.x * 1.1],
            y: [0, b.y, b.y + b.fall],
            rotate: b.rotate,
            opacity: [1, 1, 0],
            scale: 1,
          }}
          transition={{ duration: 2.4, delay: b.delay, ease: [0.15, 0.7, 0.4, 1], times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}
