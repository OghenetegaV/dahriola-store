"use client";

import { useEffect, useRef, useState } from "react";

export default function AboutDahriola() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 } // Trigger when 10% is visible
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="bg-[#FCFAFA] py-24 md:py-32 px-6 lg:px-12 overflow-hidden"
    >
      {/* Centered Content Container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* The New Funky Heading */}
        <div className={`relative mb-12 lg:mb-16 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}>
          <h2 className="font-display text-5xl md:text-6xl text-neutral-950 tracking-tighter relative z-10 pb-4">
            About <span className="italic font-light">Dahriola</span>
          </h2>
          {/* Funky Paint Brush Underline
            We use an SVG background image positioned relative to the heading.
          */}
          <div 
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-[110%] h-6 bg-no-repeat bg-contain bg-center transition-all duration-1000 delay-500 origin-left z-0 ${
              isVisible ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            }`}
            style={{ 
              backgroundImage: "url('/images/brush-stroke-green.svg')", // Link to your SVG file
            }}
          />
        </div>

        {/* The Narrative with Color Accents */}
        <div className={`space-y-12 transition-all duration-1000 delay-800 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}>
          
          <p className="text-xl md:text-2xl text-neutral-800 leading-relaxed font-light">
            DAHRIOLA is an African contemporary fashion brand that creates stylish, affordable clothing for both men and women. 
            We specialize in modern designs made from locally sourced fabrics such as 
            <span className="text-brand-beryl font-medium italic mx-1">Adiré</span>, 
            <span className="text-brand-beryl font-medium italic mx-1">Ankara</span>, 
            and <span className="text-brand-beryl font-medium italic mx-1">Aso-Oke</span>, 
            blending traditional African textiles with sleek, contemporary silhouettes.
          </p>

          {/* Clean Separator with color accent */}
          <div className="flex justify-center items-center gap-2">
            <div className="h-[1px] w-12 bg-neutral-200" />
            <div className="h-1.5 w-1.5 rounded-full bg-brand-beryl" />
            <div className="h-[1px] w-12 bg-neutral-200" />
          </div>

          <p className="text-sm md:text-base text-neutral-600 leading-loose max-w-2xl mx-auto tracking-wide italic">
            DAHRIOLA focuses on quality craftsmanship, comfortable fits, and timeless pieces that allow 
            our customers to express culture, confidence, and individuality in their everyday style.
          </p>
          
        </div>

        {/* Soft CTA or Closing Signature */}
        <div className={`mt-20 flex flex-col items-center gap-3 transition-opacity duration-1000 delay-[1200ms] ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <div className="h-8 w-[1px] bg-neutral-200" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">
            CRAFTED FOR YOU
          </span>
        </div>

      </div>
    </section>
  );
}