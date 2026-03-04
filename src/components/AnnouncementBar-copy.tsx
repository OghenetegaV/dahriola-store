"use client";

import { motion } from "framer-motion";

const messages = [
  "✨ custom fittings now available for the collective series",
  "worldwide shipping on all ready-to-wear pieces",
  "join our family for 10% off your first order",
  "bespoke inquiries are open for the upcoming season",
];

export default function AnnouncementBar() {
  return (
    <div className="relative w-full bg-neutral-900 overflow-hidden py-2.5">
      <div className="flex whitespace-nowrap">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 25,
          }}
          className="flex items-center gap-12 px-4"
        >
          {/* We repeat the messages to create the infinite loop effect */}
          {[...messages, ...messages].map((msg, i) => (
            <div key={i} className="flex items-center gap-12">
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white">
                {msg}
              </span>
              <span className="w-1 h-1 rounded-full bg-brand-beryl" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}