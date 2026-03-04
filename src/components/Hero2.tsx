"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Hero() {
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);

  return (
    <section className="relative h-screen lg:h-[90vh] w-full bg-white overflow-hidden flex flex-col lg:flex-row">
      
      {/* --- Left Side: The Collective (Ready-to-Wear) --- */}
      <motion.div 
        onMouseEnter={() => setHoveredSide("left")}
        onMouseLeave={() => setHoveredSide(null)}
        animate={{ 
          width: hoveredSide === "left" ? "60%" : hoveredSide === "right" ? "40%" : "50%",
          height: typeof window !== 'undefined' && window.innerWidth < 1024 ? "50%" : "100%"
        }}
        className="relative w-full lg:w-1/2 h-1/2 lg:h-full transition-all duration-700 ease-in-out overflow-hidden cursor-pointer border-b lg:border-b-0 lg:border-r border-white/20"
      >
        <Image 
          src="/D-34.jpg" 
          alt="Dahriola Collective" 
          fill 
          className="object-cover object-[center_20%] lg:object-center transition-transform duration-1000 scale-105 hover:scale-100"
          priority
        />
        <div className="absolute inset-0 bg-neutral-900/20 lg:bg-neutral-900/10 hover:bg-transparent transition-colors duration-500" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-12 text-center text-white">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 lg:space-y-4"
          >
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl lowercase tracking-tighter">
              the <span className="italic">collective</span>
            </h2>
            <p className="max-w-[200px] lg:max-w-xs mx-auto text-[9px] lg:text-[11px] uppercase tracking-[0.3em] font-medium opacity-90">
              Daily pieces for every version of you.
            </p>
            <Link 
              href="/shop" 
              className="inline-block mt-2 lg:mt-4 px-6 lg:px-8 py-2.5 lg:py-3 bg-white text-neutral-900 text-[9px] lg:text-[10px] uppercase tracking-widest rounded-full hover:bg-brand-beryl hover:text-white transition-all active:scale-95"
            >
              Shop the drops
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* --- Right Side: The Craft (Bespoke) --- */}
      <motion.div 
        onMouseEnter={() => setHoveredSide("right")}
        onMouseLeave={() => setHoveredSide(null)}
        animate={{ 
          width: hoveredSide === "right" ? "60%" : hoveredSide === "left" ? "40%" : "50%",
          height: typeof window !== 'undefined' && window.innerWidth < 1024 ? "50%" : "100%"
        }}
        className="relative w-full lg:w-1/2 h-1/2 lg:h-full transition-all duration-700 ease-in-out overflow-hidden cursor-pointer"
      >
        <Image 
          src="/bespoke.jpg" 
          alt="Dahriola Bespoke" 
          fill 
          className="object-cover object-center transition-transform duration-1000 scale-105 hover:scale-100"
        />
        <div className="absolute inset-0 bg-neutral-900/30 lg:bg-neutral-900/20 hover:bg-transparent transition-colors duration-500" />

        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 lg:p-12 text-center text-white">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3 lg:space-y-4"
          >
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl lowercase tracking-tighter">
              the <span className="italic text-brand-beryl">craft</span>
            </h2>
            <p className="max-w-[200px] lg:max-w-xs mx-auto text-[9px] lg:text-[11px] uppercase tracking-[0.3em] font-medium opacity-90">
              Your vision, tailored by our hands.
            </p>
            <Link 
              href="/bespoke" 
              className="inline-block mt-2 lg:mt-4 px-6 lg:px-8 py-2.5 lg:py-3 border border-white text-white text-[9px] lg:text-[10px] uppercase tracking-widest rounded-full hover:bg-white hover:text-neutral-900 transition-all active:scale-95"
            >
              Start a conversation
            </Link>
          </motion.div>
        </div>
      </motion.div>

    </section>
  );
}