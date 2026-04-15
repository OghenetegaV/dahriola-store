"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const collectionItems = [
  { id: 1, name: "Essential Trousers", image: "/new-collection/trousers.png" },
  { id: 2, name: "Signature Set", image: "/new-collection/set.png" },
  { id: 3, name: "A-Line Dress", image: "/new-collection/dress-1.png" },
  { id: 4, name: "Sculpted Wrap Dress", image: "/new-collection/dress-2.png" },
];

export default function CollectionTurntable() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const swapInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % collectionItems.length);
    }, 6000); 
    return () => clearInterval(swapInterval);
  }, []);

  const currentItem = collectionItems[currentIndex];

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-between bg-white overflow-hidden pt-4 pb-1">
      
      {/* 1. Heading Section */}
      <div className="relative z-20 text-center pt-4">
        <h2 className="font-display text-5xl md:text-6xl text-neutral-950 tracking-tighter relative z-10 pb-5">
          Shop our <span className="italic font-light">latest</span> pieces
        </h2>
        <div 
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-80 h-6 bg-no-repeat bg-contain bg-center z-0 opacity-70"
          style={{ 
            backgroundImage: "url('/brush-stroke-green.svg')", 
          }}
        />
      </div>  

      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-50 via-white to-white" />

      {/* 2. Main Image Container - Forced to 70vh */}
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
      <div className="relative flex flex-col items-center z-20 pb-2">
        <motion.div 
          key={`text-${currentItem.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.6em] font-bold text-neutral-400 mb-2">
            New Collection
          </p>
          <h3 className="font-display text-3xl md:text-4xl text-black lowercase tracking-tighter">
            {currentItem.name}
          </h3>
        </motion.div>

        {/* Index Indicators */}
        <div className="flex gap-2 mt-2">
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
      <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden lg:block">
        <span className="text-[12px] font-medium text-neutral-300 rotate-90 block tracking-widest uppercase">
          {currentIndex + 1} / {collectionItems.length}
        </span>
      </div>

    </section>
  );
}