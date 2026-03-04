"use client";

import { MessageCircle, MessageSquare, Phone, X } from "lucide-react";
import { useState } from "react";

export default function Concierge() {
  const [isOpen, setIsOpen] = useState(false);

  // Replace with your actual WhatsApp number
  const whatsappNumber = "234XXXXXXXXXX"; 
  const phoneNumber = "+234XXXXXXXXXX";

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-5 duration-300">
          <a
            href={`tel:${phoneNumber}`}
            className="flex items-center gap-3 bg-white border border-brand-laurel/20 px-4 py-3 rounded-full shadow-xl text-brand-beryl hover:bg-brand-white transition-all"
          >
            <span className="text-xs uppercase tracking-widest font-medium">Call Tailor</span>
            <Phone size={18} strokeWidth={1.5} />
          </a>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-brand-beryl px-4 py-3 rounded-full shadow-xl text-white hover:opacity-90 transition-all"
          >
            <span className="text-xs uppercase tracking-widest font-medium">WhatsApp</span>
            <MessageCircle size={18} strokeWidth={1.5} />
          </a>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-brand-beryl flex items-center justify-center text-white shadow-2xl transition-transform active:scale-90"
        aria-label="Contact Concierge"
      >
        {isOpen ? (
          <X size={24} strokeWidth={1.5} />
        ) : (
          <div className="font-display text-xl">
            <MessageSquare size={26} strokeWidth={1.2} />
          </div>
        )}
      </button>
    </div>
  );
}