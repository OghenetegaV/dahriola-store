"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const collectionItems = [
  { id: 1, name: "Essential Trousers", image: "/new-collection/trousers.png" },
  { id: 2, name: "Signature Set", image: "/new-collection/set.png" },
  { id: 3, name: "A-Line Dress", image: "/new-collection/dress-1.png" },
  { id: 4, name: "Sculpted Wrap Dress", image: "/new-collection/dress-2.png" },
];

export default function CollectionTurntable() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  // Interval for swapping items
  useEffect(() => {
    const swapInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % collectionItems.length);
    }, 6000);
    return () => clearInterval(swapInterval);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const currentItem = collectionItems[currentIndex];

  return (
    <section 
      ref={sectionRef} // Added missing ref here
      className="relative w-full min-h-screen flex flex-col items-center justify-between bg-white overflow-hidden pt-8 pb-1"
    >
      {/* Centered Content Container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-20">
        
        {/* The New Funky Heading */}
        <div className={`relative mb-12 lg:mb-16 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}>
          <h2 className="font-display text-5xl md:text-6xl text-neutral-950 tracking-tighter relative z-10 pb-4">
            {/* Shop our <span className="italic font-light">latest</span> pieces */}
           <span className="italic font-light">Coming soon</span>

          </h2>
          
          {/* Funky Paint Brush Underline */}
          <div 
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-[110%] h-6 bg-no-repeat bg-contain bg-center transition-all duration-1000 delay-500 origin-left z-0 ${
              isVisible ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            }`}
            style={{ 
              backgroundImage: "url('/brush-stroke-green.svg')", 
            }}
          />
        </div> 
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-50 via-white to-white" />

      {/* 2. Main Image Container */}
      <div className="relative z-10 w-full max-w-[1200px] h-[50vh] md:h-[70vh] flex items-center justify-center">
        
        {/* Shadow Base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] max-w-[600px] opacity-40">
          <div 
            className="aspect-[5/1] bg-neutral-200 rounded-[100%] blur-3xl"
            style={{ transform: 'rotateX(75deg)' }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            animate={{ 
              opacity: 1, 
              x: 0, 
              filter: "blur(0px)",
              y: [0, -20, 0] 
            }}
            exit={{ opacity: 0, x: -50, filter: "blur(10px)" }}
            transition={{
              opacity: { duration: 0.8 },
              x: { duration: 0.8, ease: "circOut" },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              filter: { duration: 0.8 }
            }}
            className="relative w-full h-full"
          >
            <Image
              src={currentItem.image}
              alt={currentItem.name}
              fill
              priority
              className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.05)]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Navigation / Info Section */}
      <div className="relative flex flex-col items-center z-20 pb-12">
        <motion.div 
          key={`text-${currentItem.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-neutral-400 mb-2">
            New Collection
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-black tracking-tighter">
            {currentItem.name}
          </h3>
        </motion.div>

        {/* Index Indicators */}
        <div className="flex gap-2 mt-6">
          {collectionItems.map((_, i) => (
            <div 
              key={i}
              className={`h-[1px] transition-all duration-700 ${
                i === currentIndex ? "w-12 bg-black" : "w-4 bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4. Sidebar Counter */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden lg:block z-20">
        <span className="text-[12px] font-medium text-neutral-300 -rotate-90 block tracking-widest uppercase">
          {currentIndex + 1} / {collectionItems.length}
        </span>
      </div>
    </section>
  );
}