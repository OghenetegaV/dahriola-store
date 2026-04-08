"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function ServicesGridPacked() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-0">
        
        {/* 1. Ready to Wear (Image Left, Text Right) */}
        <div className={`grid grid-cols-1 md:grid-cols-2 items-stretch transition-all duration-1000 ease-out bg-[#E8EAE3] ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}>
          {/* Left: Packed Image Container */}
          <div className="relative h-[450px] md:h-[600px] w-full overflow-hidden">
            <Image 
              src="/rtw_female_1.jpg" // Use high-res transparent PNG
              alt="Ready to Wear African contemporary dress"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          
          {/* Right: Packed Text Content */}
          <div className="flex flex-col justify-center items-start p-10 md:p-20 lg:p-24 bg-[#F2F0ED]">
            <span className="text-[10px] uppercase tracking-[0.4em] text-brand-beryl font-bold mb-5 block">
              Instant Style
            </span>
            <h3 className="font-display text-4xl md:text-5xl lg:text-6xl text-neutral-900 lowercase tracking-tighter mb-8 leading-[0.9]">
              Ready <br /> To Wear
            </h3>
            <p className="text-sm md:text-base text-neutral-600 mb-10 leading-loose max-w-lg">
              Find something you love, add to cart, and enjoy lightning-fast delivery. Premium African contemporary pieces, ready for your next occasion.
            </p>
            <Link 
              href="/category/all" 
              className="group text-[11px] uppercase tracking-[0.3em] font-black py-4 px-8 rounded-4xl bg-neutral-950 text-white hover:bg-brand-beryl transition-colors duration-500 flex items-center gap-2"
            >
              Shop Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 2. Bespoke (Text Left, Image Right - ALTERNATED) */}
        <div className={`grid grid-cols-1 md:grid-cols-2 items-stretch transition-all duration-1000 delay-300 ease-out bg-[#EAE8E4] ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}>
          {/* Left: Packed Text Content */}
          <div className="flex flex-col justify-center items-start p-10 md:p-20 lg:p-24 bg-[#F7F6F5] order-2 md:order-1">
            <span className="text-[10px] uppercase tracking-[0.4em] text-brand-beryl font-bold mb-5 block">
              Custom Tailoring
            </span>
            <h3 className="font-display text-4xl md:text-5xl lg:text-6xl text-neutral-900 lowercase tracking-tighter mb-8 leading-[0.9]">
              Bespoke <br /> Service
            </h3>
            <p className="text-sm md:text-base text-neutral-600 mb-10 leading-loose max-w-lg">
              Have a dream design in mind? Start an enquiry with our master tailors and let us bring your unique vision to life with precision.
            </p>
            <Link 
              href="/bespoke" 
              className="group text-[11px] uppercase tracking-[0.3em] font-black py-4 px-8 rounded-4xl border border-neutral-900 text-neutral-900 hover:bg-neutral-950 hover:text-white transition-all duration-500 flex items-center gap-2"
            >
              Start Enquiry Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right: Packed Image Container (order-1 on mobile, order-2 on desktop) */}
          <div className="relative h-[450px] md:h-[600px] w-full overflow-hidden order-1 md:order-2">
            <Image 
              src="/bespoke_female_2.jpg" // Use high-res transparent PNG
              alt="Bespoke tailored design session"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

      </div>
    </section>
  );
}