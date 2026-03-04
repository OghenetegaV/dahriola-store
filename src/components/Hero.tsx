"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";

const slides = [
  {
    id: "rtw-1",
    type: "rtw",
    tag: "Welcome to the family",
    title: "made for <br /> <span class='italic font-light text-neutral-500'>real life.</span>",
    description: "We believe great clothes should feel as good as they look. Come explore our latest pieces, made with love and a whole lot of care.",
    ctaText: "See What's New",
    ctaLink: "/category/all",
    image: "/D-34.jpg",
    alt: "Dahriola Friends Collective"
  },
  {
    id: "bespoke-1",
    type: "bespoke",
    tag: "Your vision, our hands",
    title: "the art of <br /> <span class='italic font-light text-brand-beryl'>bespoke.</span>",
    description: "Whether it's for a wedding or a dream you've always had, we're here to help you create a custom outfit that's uniquely yours.",
    ctaText: "Start a Conversation",
    ctaLink: "/bespoke",
    image: "/bespoke.jpg",
    alt: "Dahriola Bespoke Vision"
  },
  {
    id: "rtw-2",
    type: "rtw",
    tag: "Welcome to the family",
    title: "made for <br /> <span class='italic font-light text-neutral-500'>real life.</span>",
    description: "We believe great clothes should feel as good as they look. Come explore our latest pieces, made with love and a whole lot of care.",
    ctaText: "See What's New",
    ctaLink: "/category/all",
    image: "/D-40.jpg",
    alt: "Dahriola Summer Essentials"
  },
  {
    id: "bespoke-2",
    type: "bespoke",
    tag: "Your vision, our hands",
    title: "the art of <br /> <span class='italic font-light text-brand-beryl'>bespoke.</span>",
    description: "Whether it's for a wedding or a dream you've always had, we're here to help you create a custom outfit that's uniquely yours.",
    ctaText: "Start a Conversation",
    ctaLink: "/bespoke",
    image: "/bespoke2.jpg",
    alt: "Dahriola Tailoring Detail"
  },
  {
    id: "rtw-3",
    type: "rtw",
    tag: "Welcome to the family",
    title: "made for <br /> <span class='italic font-light text-neutral-500'>real life.</span>",
    description: "We believe great clothes should feel as good as they look. Come explore our latest pieces, made with love and a whole lot of care.",
    ctaText: "See What's New",
    ctaLink: "/category/all",
    image: "/D-1.jpg",
    alt: "Dahriola Archive 01"
  },
  {
    id: "bespoke-3",
    type: "bespoke",
    tag: "Your vision, our hands",
    title: "the art of <br /> <span class='italic font-light text-brand-beryl'>bespoke.</span>",
    description: "Whether it's for a wedding or a dream you've always had, we're here to help you create a custom outfit that's uniquely yours.",
    ctaText: "Start a Conversation",
    ctaLink: "/bespoke",
    image: "/bespoke3.jpg", 
    alt: "Dahriola Custom Craft"
  }
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen w-full bg-white overflow-hidden flex items-center pt-0">
      <motion.div 
        style={{ y: y1 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
      >
        <h1 className="font-display text-[30vw] leading-none uppercase select-none text-neutral-100">
          HELLO
        </h1>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        
        <div className="space-y-8 order-2 lg:order-1 text-center lg:text-left h-[350px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[index].type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-beryl block mb-4">
                {slides[index].tag}
              </span>
              <h2 
                className="font-display text-6xl md:text-7xl lg:text-8xl lowercase leading-[0.9] mb-6 tracking-tighter text-neutral-900"
                dangerouslySetInnerHTML={{ __html: slides[index].title }}
              />
              <p className="max-w-sm mx-auto lg:mx-0 text-sm text-neutral-600 leading-relaxed mb-8">
                {slides[index].description}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <Link 
                  href={slides[index].ctaLink} 
                  className="bg-neutral-900 text-white text-[10px] uppercase tracking-widest px-8 py-4 hover:bg-brand-beryl transition-colors active:scale-95"
                >
                  {slides[index].ctaText}
                </Link>
                <Link 
                  href="/contact" 
                  className="text-[10px] uppercase tracking-widest text-neutral-900 py-4 border-b border-neutral-200 hover:border-brand-beryl transition-all"
                >
                  Say Hi
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-xl bg-neutral-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={slides[index].id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image 
                  src={slides[index].image} 
                  alt={slides[index].alt} 
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.div 
        style={{ opacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-widest text-neutral-400">Take a look</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <ArrowDown size={16} className="text-neutral-300" />
        </motion.div>
      </motion.div>
    </section>
  );
}