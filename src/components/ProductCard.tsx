"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "../lib/sanity";

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
      className={`relative w-full aspect-[3/4] max-h-[500px] lg:max-h-[500px] overflow-hidden bg-neutral-50 transition-shadow duration-500`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {product.images.map((img: any, index: number) => (
        <Image
          key={img._key || index}
          src={urlFor(img).url()}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition-opacity duration-700 ease-in-out ${
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          }`}
          priority={index === 0}
        />
      ))}

      {!galleryOnly && (
        <div className="absolute top-6 left-6 z-10">
          <span className="bg-white/95 backdrop-blur-sm px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-brand-beryl font-semibold">
            {product.productType === 'rtw' ? 'Ready to Wear' : 'Bespoke'}
          </span>
        </div>
      )}

      {product.images.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden z-10">
          {product.images.map((_: any, index: number) => (
            <div 
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentImageIndex ? 'w-4 bg-brand-beryl' : 'w-1 bg-brand-beryl/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (galleryOnly) {
    return ImageContainer;
  }

  return (
    <Link 
      href={`/product/${product.slug}`} 
      className="group block"
    >
      {ImageContainer}

      <div className="mt-8 flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-display text-3xl text-neutral-800 leading-none group-hover:text-brand-beryl transition-colors">
            {product.name}
          </h3>
          <p className="text-[11px] text-neutral-400 uppercase tracking-[0.25em]">
            {product.categoryName}
          </p>
        </div>
        {product.productType === 'rtw' && product.priceNGN && (
          <p className="font-sans text-lg tracking-tight text-brand-beryl">
            ₦{product.priceNGN.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}