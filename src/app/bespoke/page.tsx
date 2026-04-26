"use client";

import { useState } from "react";
import BespokeEnquiry from "@/src/components/BespokeEnquiry";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";

const GALLERY_ITEMS = [
  { id: 1, type: "image", src: "/bespoke/bespoke.jpg" },
  { id: 2, type: "video", src: "/bespoke/bespoke_video_1.mp4" },
  { id: 3, type: "image", src: "/bespoke/agbada_1.jpg" },
  { id: 4, type: "image", src: "/bespoke/bespoke_2.jpg" },
  { id: 5, type: "video", src: "/bespoke/bespoke_video_2.mp4" },
  { id: 6, type: "image", src: "/bespoke/bespoke_4.jpg" },
  { id: 7, type: "image", src: "/bespoke/bespoke_female_1.jpg" },
  { id: 8, type: "image", src: "/bespoke/bespoke_female_2.jpg" },
  { id: 9, type: "image", src: "/bespoke/bespoke_5.jpg" },
  { id: 10, type: "image", src: "/bespoke/bespoke_6.jpg" },
  { id: 11, type: "image", src: "/bespoke/bespoke_7.jpg" },
  { id: 12, type: "image", src: "/bespoke/bespoke_8.jpg" },
];

export default function BespokeGallery() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeItem = activeIndex !== null ? GALLERY_ITEMS[activeIndex] : null;

  const nextItem = () => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % GALLERY_ITEMS.length);
  };

  const prevItem = () => {
    if (activeIndex === null) return;
    setActiveIndex(
      activeIndex === 0 ? GALLERY_ITEMS.length - 1 : activeIndex - 1
    );
  };

  return (
    <section className="bg-black w-full overflow-hidden relative">
      <div className="pb-16 pt-32 px-6 max-w-7xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-6xl text-[#778472] tracking-tighter">
          The Bespoke Gallery
        </h2>
        <p className="text-neutral-500 text-[10px] uppercase tracking-[0.5em] mt-4 font-bold">
          crafting narratives
        </p>
      </div>

      {/* OUTFIT-FRIENDLY GRID */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {GALLERY_ITEMS.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => setActiveIndex(index)}
              className="break-inside-avoid block w-full overflow-hidden rounded-[2rem] bg-neutral-900 group relative"
            >
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt="Bespoke outfit"
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <video
                  src={item.src}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                />
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </motion.button>
          ))}
        </div>

        {/* DESKTOP FORM BELOW GRID */}
        <div className="hidden md:flex mt-16 items-center justify-center bg-[#fcfcfc] rounded-[2rem] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.7)] border border-neutral-100 p-6">
          <BespokeEnquiry />
        </div>
      </div>

      {/* MOBILE FLOATING CTA */}
      <div className="fixed bottom-10 left-0 w-full flex justify-center z-[100] md:hidden px-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="bg-white text-black px-10 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 border border-neutral-100"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.3em]">
            Start an Enquiry
          </span>
          <Plus size={16} />
        </motion.button>
      </div>

      {/* MOBILE FULL-SCREEN ENQUIRY OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[200] bg-[#fcfcfc] overflow-y-auto md:hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-white sticky top-0 z-[210]">
              <img
                src="/logo.png"
                alt="Dahriola Logo"
                className="h-8 w-auto object-contain"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <BespokeEnquiry />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center px-4 md:px-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIndex(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(null);
              }}
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            >
              <X size={22} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prevItem();
              }}
              className="absolute left-4 md:left-8 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            >
              <ChevronLeft size={26} />
            </button>

            <div
              className="w-full h-full max-w-5xl max-h-[88vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {activeItem.type === "image" ? (
                <img
                  src={activeItem.src}
                  alt="Expanded bespoke outfit"
                  className="max-w-full max-h-[88vh] object-contain rounded-xl"
                />
              ) : (
                <video
                  src={activeItem.src}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-[88vh] object-contain rounded-xl"
                />
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextItem();
              }}
              className="absolute right-4 md:right-8 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
            >
              <ChevronRight size={26} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}