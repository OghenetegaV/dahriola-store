"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const messages = [
  "custom fittings now available for the collective series",
  "worldwide shipping on all ready-to-wear pieces",
  "join our family for 10% off your first order",
  "bespoke inquiries are open for the upcoming season",
];

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 5000); // Stays for 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full bg-neutral-900 h-9 flex items-center justify-center overflow-hidden px-4">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="text-[9px] font-bold uppercase tracking-[0.3em] text-white text-center"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}