"use client";

import { useEffect, useRef, useState } from "react";

export default function BrandEthosSoft() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 } // Trigger when 15% is visible
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="bg-white py-24 md:py-32 px-6 lg:px-12 overflow-hidden border-t border-neutral-100"
    >
      {/* Centered Content Container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* Subtle Brand Watermark */}
        <span 
          className={`text-[9px] uppercase tracking-[0.6em] text-neutral-300 font-bold mb-6 transition-all duration-1000 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          DAHRIOLA / EST. 2023
        </span>

        {/* The Main Narrative */}
        <div className={`space-y-12 transition-all duration-1000 delay-300 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}>
          
          <p className="text-xl md:text-2xl text-neutral-800 leading-relaxed font-light">
            DAHRIOLA is an African contemporary fashion brand that creates stylish, affordable clothing for both men and women. 
            We specialize in modern designs made from locally sourced fabrics such as 
            <span className="text-brand-beryl font-medium italic"> Adiré, Ankara, and Aso-Oke</span>, 
            blending traditional African textiles with sleek, contemporary silhouettes.
          </p>

          {/* Clean Separator: Small Dot or Laurel line */}
          <div className="flex justify-center items-center gap-2">
            <div className="h-[1px] w-12 bg-neutral-100" />
            <div className="h-1 w-1 rounded-full bg-brand-beryl/50" />
            <div className="h-[1px] w-12 bg-neutral-100" />
          </div>

          <p className="text-sm md:text-base text-neutral-600 leading-loose max-w-2xl mx-auto tracking-wide italic">
            DAHRIOLA focuses on quality craftsmanship, comfortable fits, and timeless pieces that allow 
            our customers to express culture, confidence, and individuality in their everyday style.
          </p>
          
        </div>

        {/* Soft CTA or Closing Signature */}
        <div className={`mt-20 flex flex-col items-center gap-3 transition-opacity duration-1000 delay-[800ms] ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <div className="h-8 w-[1px] bg-neutral-100" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">
            CRAFTED FOR YOU
          </span>
        </div>

      </div>
    </section>
  );
}