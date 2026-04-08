"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";

const ITEMS = [
  {
    id: 1,
    title: "Onyx Formal Edition",
    category: "The Luxe Collection",
    price: "120.00 USD",
    image: "/gallery/bespoke-1.jpg",
  },
  {
    id: 2,
    title: "Ivory Silk Silhouette",
    category: "Bridal Editorial",
    price: "450.00 USD",
    image: "/gallery/bespoke-2.jpg",
  },
  {
    id: 3,
    title: "Midnight Velvet Kaftan",
    category: "Atelier Signature",
    price: "280.00 USD",
    image: "/gallery/bespoke-3.jpg",
  },
  {
    id: 4,
    title: "Beryl Green Suit",
    category: "Modern Power",
    price: "320.00 USD",
    image: "/gallery/bespoke-4.jpg",
  },
  {
    id: 5,
    title: "Sahara Linen Set",
    category: "Summer RTW",
    price: "180.00 USD",
    image: "/gallery/bespoke-5.jpg",
  },
];

export default function BespokeGallery() {
  const [index, setIndex] = useState(2); // Start with the middle item

  const next = () => setIndex((prev) => (prev === ITEMS.length - 1 ? 0 : prev + 1));
  const prev = () => setIndex((prev) => (prev === 0 ? ITEMS.length - 1 : prev - 1));

  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-20">
        <h2 className="font-display text-4xl md:text-5xl text-neutral-900 lowercase tracking-tighter uppercase">
          Featured Collection
        </h2>
      </div>

      <div className="relative flex items-center justify-center h-[70vh]">
        <div className="flex items-center justify-center w-full gap-4 md:gap-8">
          {ITEMS.map((item, i) => {
            const isCenter = i === index;
            const isSide = Math.abs(i - index) === 1 || (index === 0 && i === ITEMS.length - 1) || (index === ITEMS.length - 1 && i === 0);
            
            // Only render items near the center for performance and clean UI
            const isVisible = isCenter || isSide || Math.abs(i - index) === 2;

            if (!isVisible) return null;

            return (
              <motion.div
                key={item.id}
                initial={false}
                animate={{
                  scale: isCenter ? 1 : 0.8,
                  opacity: isCenter ? 1 : 0.4,
                  x: (i - index) * 20, // Adds slight spacing shift
                  zIndex: isCenter ? 10 : 5,
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`relative shrink-0 ${isCenter ? 'w-[350px] md:w-[450px]' : 'w-[150px] md:w-[250px]'} h-[60vh] rounded-2xl overflow-hidden group cursor-pointer`}
                onClick={() => setIndex(i)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Center Item UI - Inspired by your screenshot */}
                <AnimatePresence>
                  {isCenter && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col justify-between p-8 bg-black/10 text-white"
                    >
                      <div className="flex justify-start">
                        <span className="bg-white/90 text-black text-[9px] px-3 py-1 rounded-full uppercase font-bold tracking-widest">
                          New
                        </span>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-[10px] uppercase tracking-widest opacity-70">
                          {item.category}
                        </p>
                        <h3 className="font-display text-2xl md:text-3xl leading-none lowercase">
                          {item.title}
                        </h3>
                        <p className="text-xs font-bold pt-4">
                          <span className="opacity-50 font-light">from</span> {item.price}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation & Interaction */}
      <div className="flex flex-col items-center gap-8 mt-16">
        <div className="flex items-center gap-6">
          <button onClick={prev} className="p-3 rounded-full border border-neutral-200 hover:bg-neutral-900 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          
          {/* Shop Icon Toggle */}
          <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-white shadow-xl">
            <ShoppingBag size={18} />
          </div>

          <button onClick={next} className="p-3 rounded-full border border-neutral-200 hover:bg-neutral-900 hover:text-white transition-all">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-48 h-[1px] bg-neutral-100 relative">
          <motion.div 
            animate={{ x: (index / (ITEMS.length - 1)) * 100 + '%' }}
            className="absolute top-0 left-0 w-1/3 h-full bg-neutral-900"
          />
        </div>
      </div>
    </section>
  );
}