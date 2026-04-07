"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/src/lib/sanity";
import PriceDisplay from "./PriceDisplay";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductCard({ 
  product, 
  galleryOnly = false 
}: { 
  product: any; 
  galleryOnly?: boolean;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const hasImages = product.images && product.images.length > 0;
  
  const handleMouseEnter = () => { if (product.images?.length > 1) setCurrentImageIndex(1); };
  const handleMouseLeave = () => setCurrentImageIndex(0);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
      } else {
        setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
      }
    }
  };

  if (!hasImages) return null;

  const ImageContainer = (
    <div 
      className="relative w-full aspect-[4/5] overflow-hidden rounded-sm bg-neutral-50 group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={urlFor(product.images[currentImageIndex]).url()}
            alt={product.name}
            fill
            sizes="(max-width: 500px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={currentImageIndex === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* 1. THE PRICE POP CIRCLE */}
      {product.productType === 'rtw' && product.priceNGN && (
        <div className="absolute bottom-3 right-3 z-20">
          <div className="w-18 h-18 rounded-full bg-brand-beryl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500 border-2 border-white/30">
            <PriceDisplay 
              priceNGN={product.priceNGN} 
              className="font-sans text-[14px] font-black text-white tracking-tighter"
            />
          </div>
        </div>
      )}
    </div>
  );

  if (galleryOnly) return ImageContainer;

  const productSlug = typeof product.slug === 'string' ? product.slug : product.slug?.current;

  return (
    <Link 
      href={`/product/${productSlug}`} 
      className="group block w-full max-w-[320px] mx-auto overflow-hidden bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-500 p-1 rounded-sm"
    >
      {ImageContainer}

      {/* 2. REORDERED TEXT SECTION */}
      <div className="pt-4 px-1 pb-1">
        <div className="space-y-1">
          {/* Name First */}
          <h3 className="font-display text-xl lg:text-2xl lowercase text-neutral-900 leading-none tracking-tight group-hover:text-brand-beryl transition-colors">
            {product.name}
          </h3>

          {/* Category Second */}
          <p className="text-[9px] uppercase tracking-[0.3em] text-brand-beryl font-bold">
            {product.categoryName}
          </p>

          {/* Static Sizes */}
          <div className="flex gap-2 pt-2">
            {['S', 'M', 'L', 'XL'].map((size) => (
              <span key={size} className="text-[8px] font-bold text-neutral-300 group-hover:text-neutral-400 transition-colors">
                {size}
              </span>
            ))}
          </div>
        </div>

        {/* Action Detail */}
        <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
           <div className="h-[0.5px] flex-1 bg-neutral-100" />
           <span className="text-[7px] uppercase tracking-widest text-neutral-400 font-bold">
             View Product
           </span>
        </div>
      </div>
    </Link>
  );
}