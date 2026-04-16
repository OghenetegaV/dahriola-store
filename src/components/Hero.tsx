"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

export default function Hero() {
  const controls = useAnimation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const moveLens = async () => {
      while (true) {
        await controls.start({
          left: `${Math.floor(Math.random() * 60) + 20}%`, // Moves between 20% and 80%
          top: `${Math.floor(Math.random() * 50) + 20}%`,  // Moves between 20% and 70%
          transition: { 
            duration: 6, 
            ease: "easeInOut" 
          },
        });
      }
    };

    moveLens();
  }, [controls]);

  if (!isMounted) return null;

  return (
    <section className="relative w-full h-[90vh] min-h-[600px] flex items-end overflow-hidden bg-black">
      {/* Background Image Container */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/products/jackets/group-jacket.webp"
          alt="Dahriola premium contemporary fashion"
          fill
          priority
          className="h-full w-full object-cover object-center brightness-75"
        />

        {/* The Gliding Magnifying Glass */}
        <motion.div
          animate={controls}
          initial={{ left: "50%", top: "40%" }}
          className="absolute z-20 pointer-events-none hidden lg:block"
          style={{
            width: "320px",
            height: "320px",
            transform: "translate(-50%, -50%)", // Keeps the circle centered on the point
          }}
        >
          {/* Glass Lens Container */}
          <div className="relative w-full h-full rounded-full border border-white/40 shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden bg-black">
            <motion.div
              animate={controls}
              className="absolute"
              style={{
                width: "100vw", 
                height: "90vh",
                left: "50%", // Anchor to the center of the lens
                top: "50%",
                x: "-50%", // Standard centering
                y: "-50%",
              }}
            >
              <div 
                className="absolute inset-0 transition-transform duration-700"
                style={{
                  transform: "scale(1.8)", // The Zoom Factor
                }}
              >
                <Image
                  src="/products/jackets/group-jacket.webp"
                  alt="zoom-lens"
                  fill
                  className="object-cover brightness-110"
                />
              </div>
            </motion.div>
            
            {/* Realistic Lens Refraction Overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/5 shadow-inner" />
          </div>
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>

      {/* Content Layer */}
      <div className="relative z-30 w-full px-5 sm:px-8 lg:px-12 pb-12 sm:pb-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-[800px]">
            <h1 className="font-display max-w-[10ch] text-[3.5rem] leading-[0.85] tracking-[-0.04em] text-white sm:text-[4rem] lg:text-[6.5rem]">
              Premium Contemporary Fashion
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
              <Link
                href="/category/all"
                className="group relative inline-flex h-12 min-w-[140px] items-center justify-center overflow-hidden rounded-full bg-white px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all duration-300 hover:bg-neutral-200"
              >
                <span className="relative z-10">Shop</span>
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