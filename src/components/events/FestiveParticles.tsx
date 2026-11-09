"use client";

// Canvas of drifting snow, twinkling gold sparkles and tumbling confetti.
// Pauses when off-screen and draws a single still frame for reduced motion.
import { useEffect, useRef } from "react";

type Kind = "snow" | "spark" | "confetti";
type Particle = {
  x: number;
  y: number;
  size: number;
  vy: number;
  sway: number;
  phase: number;
  spin: number;
  angle: number;
  kind: Kind;
  color: string;
};

const CONFETTI_COLORS = ["#E8C77A", "#9E1B32", "#F7F2EA", "#C9A24E", "#D94A64"];

function makeParticle(w: number, h: number, randomY: boolean): Particle {
  const roll = Math.random();
  const kind: Kind = roll < 0.6 ? "snow" : roll < 0.85 ? "spark" : "confetti";
  return {
    x: Math.random() * w,
    y: randomY ? Math.random() * h : -20,
    size:
      kind === "snow" ? 1 + Math.random() * 2.5 : kind === "spark" ? 2 + Math.random() * 3 : 4 + Math.random() * 5,
    vy: kind === "confetti" ? 0.8 + Math.random() * 1.2 : 0.3 + Math.random() * 0.9,
    sway: 0.3 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.1,
    angle: Math.random() * Math.PI,
    kind,
    color:
      kind === "snow"
        ? "255,255,255"
        : kind === "spark"
          ? "232,199,122"
          : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  };
}

export default function FestiveParticles({ density = 1, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let visible = true;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(160, (w * h) / 8000) * density);
      particles = Array.from({ length: target }, () => makeParticle(w, h, true));
      if (reduce) draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.kind === "snow") {
          ctx.fillStyle = `rgba(${p.color},${0.35 + p.size / 6})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "spark") {
          const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.04 + p.phase));
          const s = p.size * twinkle;
          ctx.fillStyle = `rgba(${p.color},${twinkle})`;
          ctx.shadowColor = `rgba(${p.color},0.9)`;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, -s * 2);
          ctx.quadraticCurveTo(0, 0, s * 2, 0);
          ctx.quadraticCurveTo(0, 0, 0, s * 2);
          ctx.quadraticCurveTo(0, 0, -s * 2, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s * 2);
          ctx.fill();
        } else {
          ctx.rotate(p.angle);
          ctx.scale(1, Math.cos(p.angle * 2)); // flutter
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }
    };

    const step = () => {
      t++;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += 0.012;
        p.y += p.vy;
        p.x += Math.sin(p.phase) * p.sway * 0.5;
        p.angle += p.spin;
        if (p.y > h + 20 || p.x < -30 || p.x > w + 30) particles[i] = makeParticle(w, h, false);
      }
      draw();
      frame = visible ? requestAnimationFrame(step) : 0;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reduce) return () => ro.disconnect();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(step);
    });
    io.observe(canvas);
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
