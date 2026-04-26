"use client";
import { X } from "lucide-react";

export default function PolicyModal({ isOpen, onClose, title, content }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  content: string[];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[2.5rem] shadow-2xl border border-neutral-200 flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <h2 className="font-display text-2xl text-neutral-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
            <X size={20} className="text-neutral-900" />
          </button>
        </div>

        {/* Text Area */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <ul className="space-y-5">
            {content.map((item, index) => (
              <li key={index} className="flex gap-4 text-sm text-neutral-600 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10 p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
             <p className="text-[10px] uppercase font-black tracking-widest text-neutral-400 text-center">
                By shopping with us, you acknowledge and agree to these policies.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}