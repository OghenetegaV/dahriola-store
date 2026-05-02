"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Hero() {
  const [isMounted, setIsMounted] = useState(false);

  const heroImage = "/products/jackets/group-jacket.webp";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <section className="relative w-full h-[90vh] min-h-[600px] flex items-end overflow-hidden bg-black">
      
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={heroImage}
          alt="Dahriola premium contemporary fashion"
          fill
          priority
          className="object-cover object-center md:object-[center_28%] brightness-75"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-30 w-full px-5 sm:px-8 lg:px-12 pb-12 sm:pb-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-[800px]">
            
            <h1 className="font-display max-w-[10ch] text-[3.5rem] leading-[0.85] tracking-[-0.04em] text-white sm:text-[4rem] lg:text-[6.5rem]">
              African Contemporary Fashion
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
              
              <Link
                href="/category/all"
                className="inline-flex h-12 min-w-[140px] items-center justify-center rounded-full bg-white px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all duration-300 hover:bg-neutral-200"
              >
                Shop
              </Link>

              <Link
                href="/bespoke"
                className="inline-flex h-12 min-w-[140px] items-center justify-center rounded-full border border-white/30 bg-white/5 backdrop-blur-md px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all duration-500 hover:border-white hover:bg-white/20 hover:-translate-y-1"
              >
                Bespoke
              </Link>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}