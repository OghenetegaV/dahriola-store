"use client";

import { useStore } from "@/src/store/useStore";
import { useState, useEffect } from "react";

interface PriceProps {
  priceNGN: number;
  className?: string; // Add this
}

export default function PriceDisplay({ priceNGN, className }: PriceProps) {
  const { currency, exchangeRates } = useStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Use a smaller pulse for the card view
  if (!hasHydrated) return <div className={`animate-pulse bg-neutral-100 rounded ${className || 'h-8 w-24'}`} />;

  const convertedPrice = priceNGN * exchangeRates[currency];

  return (
    <p className={className || "mt-6 font-sans text-2xl text-brand-beryl tracking-tight font-medium"}>
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
      }).format(convertedPrice)}
    </p>
  );
}