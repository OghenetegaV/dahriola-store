"use client";

import { MessageCircle, MessageSquare, Phone, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Concierge() {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappNumber = "+2347065364401"; 
  const phoneNumber = "+2347065364401";

  return (
    <div className="fixed bottom-8 right-8 z-[150] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-end gap-3 mb-2"
          >
            {/* Secondary Action: Call Designer (Smaller/Ghost style) */}
            <motion.a
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              href={`tel:${phoneNumber}`}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-neutral-200 px-4 py-2.5 rounded-full shadow-lg text-neutral-600 hover:text-neutral-900 transition-all"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Call Designer</span>
              <Phone size={14} strokeWidth={1.5} />
            </motion.a>

            {/* Primary Action: WhatsApp (Larger/Brand style) */}
            <motion.a
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-brand-beryl px-6 py-4 rounded-full shadow-xl text-white hover:brightness-110 hover:shadow-brand-beryl/20 transition-all"
            >
              <span className="text-[11px] uppercase tracking-[0.3em] font-bold mr-3 border-r border-white/20 pr-3">WhatsApp</span>
              <MessageCircle size={20} strokeWidth={1.5} />
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-16 rounded-full bg-brand-beryl flex items-center justify-center text-white shadow-2xl z-10"
        aria-label="Contact Concierge"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} strokeWidth={1.5} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageSquare size={26} strokeWidth={1.2} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}