"use client";

import { useState } from "react";
import BespokeEnquiry from "@/src/components/BespokeEnquiry";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";

const GALLERY_ITEMS = [
  { id: 1, type: "image", src: "/bespoke/bespoke.jpg", span: "md:col-span-2 md:row-span-2", order: "md:order-1" },
  { id: 2, type: "video", src: "/videos/client-1.mp4", span: "md:col-span-1 md:row-span-1", order: "md:order-2" },
  { id: 3, type: "image", src: "/bespoke/bespoke2.jpg", span: "md:col-span-1 md:row-span-2", order: "md:order-3" },
  { id: 4, type: "image", src: "/bespoke/bespoke3.jpg", span: "md:col-span-1 md:row-span-1", order: "md:order-4" },
  { id: 5, type: "video", src: "/videos/client-2.mp4", span: "md:col-span-2 md:row-span-1", order: "md:order-6" }, // Order 5 is the Form
  { id: 6, type: "image", src: "/bespoke/bespoke4.jpg", span: "md:col-span-1 md:row-span-2", order: "md:order-7" },
  { id: 7, type: "image", src: "/bespoke/agbada_1.jpg", span: "md:col-span-2 md:row-span-2", order: "md:order-8" },
  { id: 8, type: "video", src: "/videos/client-3.mp4", span: "md:col-span-1 md:row-span-2", order: "md:order-9" },
];

export default function BespokeGallery() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-black w-full overflow-hidden relative">
      <div className="pb-16 pt-32 px-6 max-w-7xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-6xl text-[#778472] tracking-tighter">
          The Bespoke Gallery
        </h2>
        <p className="text-neutral-500 text-[10px] uppercase tracking-[0.5em] mt-4 font-bold">crafting narratives</p>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[250px] md:auto-rows-[400px]">
        
        {/* DESKTOP FORM: Fixed at position 5 in the sequence */}
        <div className="hidden md:flex md:col-span-2 md:row-span-2 items-center justify-center z-10 relative md:order-5 bg-[#fcfcfc]">
          <BespokeEnquiry />
        </div>

        {/* GALLERY MEDIA */}
        {GALLERY_ITEMS.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={`relative group overflow-hidden bg-neutral-900 ${item.span} ${item.order}`}
          >
            {item.type === "image" ? (
              <img
                src={item.src}
                alt="Atelier Piece"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              />
            ) : (
              <video
                src={item.src}
                autoPlay muted loop playsInline
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
          </motion.div>
        ))}
      </div>

      {/* MOBILE FLOATING CTA */}
      <div className="fixed bottom-10 left-0 w-full flex justify-center z-[100] md:hidden px-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="bg-white text-black px-10 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 border border-neutral-100"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Start an Enquiry</span>
          <Plus size={16} />
        </motion.button>
      </div>

      {/* MOBILE FULL-SCREEN OVERLAY */}
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
              <span className="font-display text-xl lowercase tracking-tighter"></span>
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
    </section>
  );
}