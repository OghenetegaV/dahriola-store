"use client";

import { useState } from "react";
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
      {/* TRIGGER */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-[9px] uppercase tracking-widest font-bold text-brand-beryl border-b border-brand-beryl/20 hover:text-black transition-colors"
      >
        Guide
      </button>

      {/* MODAL */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white w-full max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-3xl overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="p-4 md:p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Ruler size={18} className="text-brand-beryl" />
                <h3 className="font-display text-lg md:text-2xl tracking-tight">
                  Size Guide
                </h3>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-8 md:space-y-12">
              {charts.map((chart) => (
                <div key={chart.src} className="space-y-3">
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400">
                    {chart.name}
                  </p>

                  {/* FIXED IMAGE DISPLAY */}
                  <div className="w-full overflow-auto rounded-xl border border-neutral-100 bg-neutral-50 touch-pan-x touch-pan-y">
                    <img
                      src={chart.src}
                      alt={chart.name}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div className="p-3 md:p-4 bg-neutral-50 text-center">
              <p className="text-[9px] md:text-[10px] text-neutral-500 uppercase tracking-widest">
                All measurements are in inches unless stated otherwise.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}