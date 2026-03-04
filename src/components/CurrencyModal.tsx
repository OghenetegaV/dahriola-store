"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";

export default function CurrencyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrency } = useStore();

  useEffect(() => {
    const hasSet = localStorage.getItem("currency-set");
    if (!hasSet) setIsOpen(true);
  }, []);

  const handleSelect = (code: 'NGN' | 'USD' | 'GBP' | 'EUR') => {
    setCurrency(code);
    localStorage.setItem("currency-set", "true");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-white p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-brand-beryl font-bold">Location Preference</span>
            <h2 className="font-display text-4xl lowercase mt-4 mb-8 leading-tight">
              Select your <span className="italic">preferred</span> currency
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {['NGN', 'USD', 'GBP', 'EUR'].map((cur) => (
                <button
                  key={cur}
                  onClick={() => handleSelect(cur as any)}
                  className="py-4 border border-neutral-100 rounded-2xl hover:bg-neutral-900 hover:text-white transition-all text-[10px] uppercase tracking-widest font-bold"
                >
                  {cur}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}