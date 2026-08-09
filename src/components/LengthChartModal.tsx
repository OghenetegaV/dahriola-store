// src/components/LengthChartModal.tsx
// A "View Length Chart" button that opens a popup showing Dahriola's custom
// length/size chart image. Self-contained (only lucide-react + next/image), so
// it works regardless of the existing SizeGuideModal.
//
// IMAGE: place your chart at  public/length-size-chart.png
// (the path below resolves to that file).

"use client";

import { useState } from "react";
import Image from "next/image";
import { Ruler, X } from "lucide-react";

export default function LengthChartModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-beryl underline underline-offset-2 hover:opacity-80"
      >
        <Ruler size={14} />
        View Length Chart
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-black">Length Chart</h3>
                <p className="text-[12px] text-neutral-500 mt-1">
                  Use this to find your best length. We tailor to the height /
                  length you enter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full">
              <Image
                src="/size-chart/length-size-chart.png"
                alt="Dahriola length and size chart"
                width={1000}
                height={1400}
                className="w-full h-auto rounded-lg border border-neutral-100"
                sizes="(max-width: 640px) 90vw, 500px"
              />
            </div>

            <p className="text-[11.5px] text-neutral-500 mt-4 leading-5">
              Not sure which to choose? Enter your <strong>height</strong> (e.g.
              5&apos;6&quot; / 168cm) or the <strong>exact length</strong> you want
              in the field, and we&apos;ll tailor it for you.
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full h-11 rounded-lg bg-brand-beryl text-white text-[13px] font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
