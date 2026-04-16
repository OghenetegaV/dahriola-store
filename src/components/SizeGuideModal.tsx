"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Ruler } from "lucide-react";

export default function SizeGuideModal() {
  const [isOpen, setIsOpen] = useState(false);

  const charts = [
    { name: "Dress Chart", src: "/size-chart/female-dress-chart.png" },
    { name: "Shirt Chart", src: "/size-chart/male-shirt-size-chart.png" },
    { name: "Length Guide", src: "/size-chart/length-size-chart.png" },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[9px] uppercase tracking-widest font-bold text-brand-beryl border-b border-brand-beryl/20 hover:text-black transition-colors"
      >
        Guide
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden relative flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Ruler size={18} className="text-brand-beryl" />
                <h3 className="font-display text-2xl tracking-tight">Size Guide</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content - Scrollable Images */}
            <div className="p-6 overflow-y-auto space-y-12">
              {charts.map((chart) => (
                <div key={chart.src} className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400">
                    {chart.name}
                  </p>
                  <div className="relative w-full aspect-[4/3] bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100">
                    <Image
                      src={chart.src}
                      alt={chart.name}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-neutral-50 text-center">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                All measurements are in inches unless stated otherwise.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}