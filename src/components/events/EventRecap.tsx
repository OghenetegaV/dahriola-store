"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PortableText, type PortableTextBlock } from "@portabletext/react";
import { ArrowRight, Camera, ChevronLeft, ChevronRight, ExternalLink, Play, X } from "lucide-react";
import { openNewsletterPopup } from "@/src/components/NewsletterPopup";
import { useStore } from "@/src/store/useStore";
import { type EventRecap as EventRecapData, eventLocation, formatEventDateRange, videoEmbed } from "@/src/lib/events";

const EASE = [0.22, 1, 0.36, 1] as const;

function Lightbox({
  images,
  index,
  onClose,
  onMove,
}: {
  images: EventRecapData["gallery"];
  index: number;
  onClose: () => void;
  onMove: (dir: 1 | -1) => void;
}) {
  const img = images[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove(1);
      if (e.key === "ArrowLeft") onMove(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onMove]);

  // Simple swipe on phones
  const [touchX, setTouchX] = useState<number | null>(null);

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) onMove(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
        <X size={20} />
      </button>
      {images.length > 1 && (
        <>
          <button
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              onMove(-1);
            }}
            className="absolute left-3 z-10 hidden rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              onMove(1);
            }}
            className="absolute right-3 z-10 hidden rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.figure
          key={img.url}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="flex max-h-full max-w-full flex-col items-center px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${img.url}?w=2000&fit=max&auto=format`} alt={img.caption || "Event photo"} className="max-h-[82vh] max-w-full object-contain" />
          <figcaption className="mt-4 text-center text-sm text-white/80">
            {img.caption && <span className="block">{img.caption}</span>}
            <span className="text-[11px] tracking-[0.2em] text-white/50">
              {index + 1} / {images.length}
            </span>
          </figcaption>
        </motion.figure>
      </AnimatePresence>
    </motion.div>
  );
}

type GalleryImage = EventRecapData["gallery"][number];

/** Spreads photos across columns by height, so every column gets used evenly. */
function toColumns(images: GalleryImage[], count: number) {
  const cols: { img: GalleryImage; index: number }[][] = Array.from({ length: count }, () => []);
  const heights = new Array(count).fill(0);
  images.forEach((img, index) => {
    const ratio = img.width && img.height ? img.height / img.width : 1.25;
    const target = heights.indexOf(Math.min(...heights));
    cols[target].push({ img, index });
    heights[target] += ratio;
  });
  return cols;
}

export default function EventRecap({ event }: { event: EventRecapData }) {
  const reduce = useReducedMotion();
  const { currency, exchangeRates } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const gallery = event.gallery || [];
  const visible = showAll ? gallery : gallery.slice(0, 18);
  const videos = (event.videos || []).map(videoEmbed);
  const location = eventLocation(event);
  const hero = gallery[0]?.url || event.flyerUrl;

  const move = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + gallery.length) % gallery.length)),
    [gallery.length]
  );
  const close = useCallback(() => setOpen(null), []);

  const money = (ngn?: number) =>
    typeof ngn === "number"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(ngn * (exchangeRates[currency] || 1))
      : "";

  const story = (event.recap?.length ? event.recap : event.description) as PortableTextBlock[] | undefined;

  return (
    <div className="event-experience relative overflow-hidden">
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[78svh] items-end overflow-hidden bg-black pt-20">
        {hero && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-0"
            initial={{ scale: reduce ? 1 : 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.4, ease: EASE }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${hero}?w=2000&fit=max&auto=format`} alt="" className="h-full w-full object-cover object-[center_20%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
          </motion.div>
        )}

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/70"
          >
            That&apos;s a wrap
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE }}
            className="mt-4 max-w-4xl font-display text-5xl leading-[0.95] tracking-[-0.04em] text-white md:text-7xl"
          >
            {/* non-breaking hyphen so "Pop-up" never splits across lines */}
            <span>{event.title.replace(/-/g, "‑")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-5 text-sm md:text-base text-white/80"
          >
            {formatEventDateRange(event)}
            {location && ` · ${location}`}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-6 max-w-xl text-lg text-white/90"
          >
            Thank you to everyone who came and celebrated with us. Here are some of our favourite moments.
          </motion.p>
          {gallery.length > 0 && (
            <motion.a
              href="#gallery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-black hover:bg-neutral-200"
            >
              <Camera size={15} /> See the photos ({gallery.length})
            </motion.a>
          )}
        </div>
      </section>

      {/* ================= STORY ================= */}
      {story && story.length > 0 && (
        <section className="relative py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative z-10 mx-auto max-w-3xl px-6 text-center"
          >
            <span className="text-[10px] uppercase tracking-[0.45em] text-brand-beryl">The story</span>
            <div className="mt-6 space-y-5 font-display text-xl leading-relaxed text-neutral-600 md:text-2xl">
              <PortableText value={story} />
            </div>
          </motion.div>
        </section>
      )}

      {/* ================= GALLERY ================= */}
      {gallery.length > 0 && (
        <section id="gallery" className="relative scroll-mt-24 pb-20">
          <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
            {[
              { count: 2, cls: "grid grid-cols-2 gap-3 md:hidden" },
              { count: 3, cls: "hidden md:grid md:grid-cols-3 md:gap-4 lg:hidden" },
              { count: 4, cls: "hidden lg:grid lg:grid-cols-4 lg:gap-4" },
            ].map((layout) => (
            <div key={layout.count} className={layout.cls}>
              {toColumns(visible, layout.count).map((col, c) => (
              <div key={c} className="flex flex-col gap-3 md:gap-4">
              {col.map(({ img, index: i }) => (
                <motion.button
                  key={img.url}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.06, ease: EASE }}
                  onClick={() => setOpen(i)}
                  className="group relative block w-full overflow-hidden rounded-xl"
                  aria-label={img.caption ? `Open photo: ${img.caption}` : `Open photo ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${img.url}?w=800&fit=max&auto=format`}
                    alt={img.caption || `Event photo ${i + 1}`}
                    loading="lazy"
                    width={img.width}
                    height={img.height}
                    style={img.lqip ? { backgroundImage: `url(${img.lqip})`, backgroundSize: "cover" } : undefined}
                    className="block h-auto w-full transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  {img.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs opacity-0 transition-opacity group-hover:opacity-100">
                      {img.caption}
                    </span>
                  )}
                </motion.button>
              ))}
              </div>
              ))}
            </div>
            ))}
            {!showAll && gallery.length > visible.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="rounded-full border border-neutral-300 px-7 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                >
                  Show all {gallery.length} photos
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================= VIDEOS ================= */}
      {(videos.length > 0 || event.videoFiles.length > 0) && (
        <section className="relative pb-20">
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <h2 className="flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-brand-beryl">
              <Play size={14} /> Watch
            </h2>
            <div
              className={`mt-6 grid gap-6 ${
                videos.length + event.videoFiles.length > 1 ? "md:grid-cols-2" : "mx-auto max-w-3xl"
              }`}
            >
              {event.videoFiles.map((v) => (
                <figure key={v.url} className="overflow-hidden rounded-2xl border border-neutral-200 bg-black">
                  <video controls playsInline preload="metadata" className="block max-h-[640px] w-full bg-black">
                    <source src={v.url} type={v.mimeType || "video/mp4"} />
                  </video>
                  {v.caption && <figcaption className="p-3 text-sm text-neutral-600">{v.caption}</figcaption>}
                </figure>
              ))}
              {videos.map((v) =>
                v.kind === "link" ? (
                  <a
                    key={v.src}
                    href={v.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-card flex items-center justify-between rounded-2xl p-6 text-sm"
                  >
                    Watch the video <ExternalLink size={16} className="text-brand-beryl" />
                  </a>
                ) : (
                  <div
                    key={v.src}
                    className={`overflow-hidden rounded-2xl border border-neutral-200 bg-black ${v.portrait ? "mx-auto w-full max-w-[400px]" : ""}`}
                  >
                    <iframe
                      src={v.src}
                      title="Event video"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className={`block w-full ${v.portrait ? "aspect-[9/16]" : "aspect-video"}`}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================= SHOP THE LOOK ================= */}
      {event.featuredProducts.length > 0 && (
        <section className="relative pb-24">
          <div className="relative z-10 mx-auto max-w-6xl px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.45em] text-brand-beryl">As seen at the event</span>
                <h2 className="mt-3 font-display text-3xl md:text-5xl">Shop the look</h2>
              </div>
              <Link href="/category/all" className="hidden text-[11px] uppercase tracking-[0.25em] text-neutral-600 hover:text-brand-beryl sm:inline-flex items-center gap-2">
                All pieces <ArrowRight size={13} />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {event.featuredProducts.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
                >
                  <Link href={`/product/${p.slug}`} className="group block">
                    <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200">
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${p.image}?w=600&h=750&fit=crop&auto=format`}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mt-3 text-sm">{p.name}</p>
                    <p className="text-sm text-neutral-500">{money(p.priceNGN)}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= NEXT TIME ================= */}
      <section className="relative pb-28">
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <div className="glow-border p-10 text-center md:p-14">
            <h2 className="font-display text-3xl md:text-5xl">
              <span className="shimmer-text">Don&apos;t miss the next one</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-neutral-500">
              Be the first to hear about our next pop-up, new collections and offers.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => openNewsletterPopup()}
                className="h-12 rounded-full bg-neutral-950 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
              >
                Keep me posted
              </button>
              <Link
                href="/events"
                className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-900 hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
              >
                All events
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {open !== null && gallery[open] && <Lightbox images={gallery} index={open} onClose={close} onMove={move} />}
      </AnimatePresence>
    </div>
  );
}
