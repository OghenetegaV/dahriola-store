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
  
  const handleMouseEnter = () => {
    if (product.images?.length > 1) setCurrentImageIndex(1);
  };
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
      className="relative w-full aspect-[2/3] lg:aspect-[3/4] overflow-hidden bg-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0, 0.67, 0] }}
          className="absolute inset-0"
        >
          <Image
            src={urlFor(product.images[currentImageIndex]).url()}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={currentImageIndex === 0}
          />
        </motion.div>
      </AnimatePresence>

      {!galleryOnly && (
        <div className="absolute top-5 right-5 z-10">
          <span className="text-[7px] uppercase tracking-[0.5em] font-bold text-neutral-900 border border-neutral-900/10 px-3 py-1.5 bg-white/40 backdrop-blur-md">
            {product.productType === 'rtw' ? 'RTW' : 'Bespoke'}
          </span>
        </div>
      )}

      {product.images.length > 1 && (
        <div className="absolute bottom-5 right-5 flex gap-1 z-10">
          {product.images.map((_: any, index: number) => (
            <div 
              key={index}
              className={`h-[1px] transition-all duration-500 ${
                index === currentImageIndex ? 'w-4 bg-neutral-900' : 'w-1 bg-neutral-900/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (galleryOnly) return ImageContainer;

  const productSlug = typeof product.slug === 'string' ? product.slug : product.slug?.current;

  return (
    <Link href={`/product/${productSlug}`} className="group block space-y-6">
      {ImageContainer}

      <div className="grid grid-cols-12 gap-x-4 items-start pt-2 px-1">
        <div className="col-span-12 md:col-span-8 space-y-2">
          <p className="text-[8px] uppercase tracking-[0.6em] text-neutral-400 font-bold leading-none">
            {product.categoryName}
          </p>
          <h3 className="font-display text-2xl lowercase text-neutral-900 group-hover:text-brand-beryl transition-colors leading-[0.95]">
            {product.name}
          </h3>
        </div>
        
        {product.productType === 'rtw' && product.priceNGN && (
          <div className="col-span-12 md:col-span-4 md:text-right mt-2 md:mt-0">
             <PriceDisplay 
              priceNGN={product.priceNGN} 
              className="font-sans text-[11px] font-bold tracking-tight text-neutral-900 mt-0"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 px-1">
        <div className="h-[1px] w-0 group-hover:w-full bg-brand-beryl/20 transition-all duration-1000 ease-out" />
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 text-[8px] uppercase tracking-[0.4em] text-neutral-500 font-bold flex items-center gap-2">
          View Details <span className="h-[1px] w-3 bg-neutral-300"></span>
        </span>
      </div>
    </Link>
  );
}