"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Replace these with the actual paths to your transparent PNGs
const collectionItems = [
  { id: 1, name: "Beryl Jacket", image: "/products/set/alafia-set/alafia-set-1.jpg" }, // Use your PNG path here
  { id: 2, name: "Alafia Shorts", image: "/products/jackets/jacket-1.jpg" },      // Use your PNG path here
  { id: 3, name: "Tolu Dress", image: "/products/kimono/kimono-1.jpg" },         // Use your PNG path here
];

export default function CollectionTurntable() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Autonomous Swapping and 360 Rotation Logic
  useEffect(() => {
    const swapInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % collectionItems.length);
    }, 10000); // Swaps every 10 seconds

    return () => clearInterval(swapInterval);
  }, []);

  const currentItem = collectionItems[currentIndex];

  return (
    <section className="relative w-full h-[80vh] min-h-[500px] flex items-center justify-center bg-black overflow-hidden pt-20">
      
      {/* 1. Futuristic Levitating Turntable */}
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[80%] max-w-[800px]">
        {/* Main Base Disc */}
        <div 
          className="relative aspect-[5/1] bg-neutral-900 rounded-full border border-neutral-700/50 shadow-[0_0_100px_rgba(255,255,255,0.05)]"
          style={{ transform: 'rotateX(75deg)' }}
        >
          {/* Central Indent */}
          <div className="absolute inset-[15%] rounded-full bg-black/50 border border-neutral-800" />
          
          {/* Spotlight Beam Source (From within the base) */}
          <div className="absolute inset-x-[30%] top-[40%] bottom-[40%] bg-gradient-to-t from-neutral-500/10 to-transparent blur-[15px]" />
        </div>
      </div>

      {/* 2. Spotlight Cone Effect (Upward Beam) */}
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-full h-[60%] pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-neutral-200/5 via-neutral-900/0 to-neutral-900/0 blur-md" />
      </div>

      {/* 3. The 360 Rotating, Levitating Design */}
      <div className="relative z-10 w-[500px] h-[500px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 50, rotate: 0 }}
            animate={{ 
              opacity: 1, 
              y: [0, -20, 0], // Floating motion
              rotate: 360 // Continuous 360 rotation
            }}
            exit={{ opacity: 0, y: -50 }}
            transition={{
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 10, repeat: Infinity, ease: "linear" }, // Control 360 speed here
              opacity: { duration: 1 },
            }}
            className="relative w-[300px] h-[400px]"
          >
            <Image
              src={currentItem.image}
              alt={currentItem.name}
              fill
              priority
              className="object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" // Enhances spotlight popup
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. Downward Reflection (Crucial for Levitating Illusion) */}
      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-0 w-[500px] h-[300px] opacity-10 pointer-events-none">
        <div className="relative w-full h-full scale-y-[-1] blur-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={`reflect-${currentItem.id}`}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-full h-full flex items-center justify-center"
            >
              <Image src={currentItem.image} alt="reflection" fill className="object-contain" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 5. Minimalist Text/Controls Overlay */}
      <div className="absolute top-10 right-10 z-20 text-right">
        <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-neutral-500 mb-2">New Collection</p>
        <h3 className="font-display text-3xl text-white lowercase tracking-tight">{currentItem.name}</h3>
      </div>
    </section>
  );
}