"use client";

import { motion } from "motion/react";
import { ArrowRight, Instagram } from "lucide-react";

export default function ComingSoon() {
  // Animation variants for cleaner code
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  };

  return (
    <main className="relative flex min-h-[85vh] items-center justify-center bg-brand-white px-6 overflow-hidden">
      
      {/* Animated Background Element */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <h2 className="font-display text-[30vw] text-black select-none">DH</h2>
      </motion.div>

      <div className="relative z-10 max-w-xl text-center">
        {/* Subtle Badge - Fades in first */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-10 flex justify-center"
        >
          <span className="bg-neutral-100 px-4 py-1 text-[9px] uppercase tracking-[0.4em] text-neutral-400 font-bold">
            Archive // Progress
          </span>
        </motion.div>
        
        {/* Heading - Elegant slide up */}
        <motion.h1 
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: 0.4 }}
          className="font-display text-5xl md:text-7xl lowercase tracking-tighter text-neutral-900 leading-none mb-8"
        >
          this page is <br /> 
          <span className="italic text-brand-beryl relative inline-block">
            coming soon.
            <motion.span 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, delay: 1, ease: "easeInOut" }}
              className="absolute -bottom-2 left-0 h-[1px] bg-brand-beryl/40"
            />
          </span>
        </motion.h1>

        {/* Paragraph - Soft fade */}
        <motion.p 
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: 0.6 }}
          className="mx-auto mb-16 max-w-sm text-[10px] md:text-xs text-neutral-400 leading-relaxed uppercase tracking-[0.2em]"
        >
          We are currently refining the store interface. 
          For immediate inquiries or bespoke bookings, please contact us via WhatsApp.
        </motion.p>

        <motion.div 
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: 0.8 }}
          className="flex flex-col items-center gap-12"
        >
          {/* Main Action with Hover Animation */}
          <a 
            href="https://wa.me/2347065364401"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-900 transition-colors hover:text-brand-beryl"
          >
            Contact the Tailor
            <div className="relative overflow-hidden">
                <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-8" />
                <ArrowRight size={16} className="absolute top-0 -left-8 transition-transform duration-500 group-hover:translate-x-8 text-brand-beryl" />
            </div>
          </a>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 pt-4">
            <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-300">Stay updated</p>
            <a href="https://instagram.com/dahriola_" className="text-neutral-400 hover:text-neutral-900 transition-colors">
              <Instagram size={16} strokeWidth={1.5} />
            </a>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}


