"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Check if user has already seen/closed the popup recently
    const hasSeenPopup = localStorage.getItem("dahriola-newsletter-seen");
    
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // 5 second delay for a premium feel
      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    // Store timestamp to hide for 7 days
    localStorage.setItem("dahriola-newsletter-seen", Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Popup Content */}
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[900px] bg-white overflow-hidden flex flex-col md:flex-row shadow-2xl"
          >
            {/* Close Button */}
            <button 
              onClick={closePopup}
              className="absolute top-6 right-6 z-20 p-2 hover:bg-neutral-50 rounded-full transition-colors text-neutral-400 hover:text-neutral-900"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Left Side: Visual (Editorial Image) */}
            <div className="relative w-full md:w-1/2 h-[300px] md:h-auto bg-neutral-100">
              <Image 
                src="/newsletter-visual.jpg" // Add a high-res editorial shot here
                alt="Dahriola Couture"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/5" />
            </div>

            {/* Right Side: Content */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
              <div className="space-y-8">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.5em] text-neutral-400 font-bold block mb-4">
                    The Dahriola Archive
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl lowercase text-neutral-900 leading-[0.95] tracking-tighter">
                    join the inner <br />
                    <span className="text-brand-beryl italic">circle.</span>
                  </h2>
                </div>

                <p className="text-[11px] uppercase tracking-widest leading-relaxed text-neutral-500 max-w-[280px]">
                  be the first to access new collections, bespoke appointments, and seasonal lookbooks.
                </p>

                <form className="space-y-6 pt-4">
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ENTER EMAIL ADDRESS"
                      className="w-full bg-transparent border-b border-neutral-200 pb-4 text-[11px] tracking-[0.3em] focus:outline-none focus:border-brand-beryl transition-all duration-700 placeholder:text-neutral-300"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full py-5 bg-neutral-900 text-white text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-brand-beryl transition-all duration-500 flex items-center justify-center gap-3 group"
                  >
                    Subscribe <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />
                  </button>
                </form>

                <p className="text-[8px] uppercase tracking-[0.2em] text-neutral-300 text-center italic">
                  No spam. Just precision and vision.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}