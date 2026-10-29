"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { openNewsletterPopup } from "./NewsletterPopup";

const messages = [
  { text: "🚚worldwide shipping" },
  { text: "🎟️join our family for 10% off your first order", newsletter: true },
  { text: "🪡open for bespoke inquiries" },
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
    <div className="fixed top-0 z-[100] w-full bg-black h-9 
    flex items-center justify-center overflow-hidden px-4">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="text-[9px] font-bold uppercase tracking-[0.3em] text-white text-center"
        >
          {messages[index].newsletter ? (
            <button
              type="button"
              onClick={() => openNewsletterPopup()}
              className="uppercase tracking-[0.3em] underline underline-offset-4"
            >
              {messages[index].text}
            </button>
          ) : (
            messages[index].text
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}