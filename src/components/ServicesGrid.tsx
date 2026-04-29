"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Instagram } from "lucide-react";

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
        
        {/* 1. Ready to Wear */}
        <div className={`grid grid-cols-1 md:grid-cols-2 items-stretch transition-all duration-1000 ease-out bg-[#E8EAE3] ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}>
          {/* Left: Two Images */}
          <div className="grid grid-cols-2 h-[450px] md:h-[600px] w-full overflow-hidden">
            <div className="relative w-full h-full overflow-hidden">
              <Image 
                src="/ready-to-wear/rtw_1.jpg"
                alt="Ready to Wear African contemporary fashion"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            <div className="relative w-full h-full overflow-hidden">
              <Image 
                src="/ready-to-wear/rtw_2.jpg"
                alt="Ready to Wear Dahriola collection"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
          
          {/* Right: Text Content */}
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

            <div className="flex flex-wrap items-center gap-3">
              <Link 
                href="/category/all" 
                className="group text-[11px] uppercase tracking-[0.3em] font-black py-4 px-8 rounded-4xl bg-neutral-950 text-white hover:bg-brand-beryl transition-colors duration-500 flex items-center gap-2"
              >
                Shop Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="https://www.instagram.com/dahriola_/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 w-12 rounded-full bg-white text-neutral-950 border border-neutral-200 flex items-center justify-center hover:bg-brand-beryl hover:text-white hover:border-brand-beryl transition-all duration-500"
                aria-label="Dahriola Ready to Wear Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* 2. Bespoke */}
        <div className={`grid grid-cols-1 md:grid-cols-2 items-stretch transition-all duration-1000 delay-300 ease-out bg-[#EAE8E4] ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}>
          {/* Left: Text Content */}
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

            <div className="flex flex-wrap items-center gap-3">
              <Link 
                href="/bespoke" 
                className="group text-[11px] uppercase tracking-[0.3em] font-black py-4 px-8 rounded-4xl border border-neutral-900 text-neutral-900 hover:bg-neutral-950 hover:text-white transition-all duration-500 flex items-center gap-2"
              >
                Start Enquiry Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="https://www.instagram.com/dahriola.bespoke/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 w-12 rounded-full bg-white text-neutral-950 border border-neutral-200 flex items-center justify-center hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-all duration-500"
                aria-label="Dahriola Bespoke Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Right: Two Images */}
          <div className="grid grid-cols-2 h-[450px] md:h-[600px] w-full overflow-hidden order-1 md:order-2">
            <div className="relative w-full h-full overflow-hidden">
              <Image 
                src="/bespoke/bespoke_5.jpg"
                alt="Bespoke tailored design"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            <div className="relative w-full h-full overflow-hidden">
              <Image 
                src="/bespoke/bespoke_12.jpg"
                alt="Dahriola bespoke service"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}