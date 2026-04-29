"use client";

import { useStore } from "@/src/store/useStore";
import { useState, useEffect } from "react";

interface PriceProps {
  priceNGN: number;
  className?: string;
}

export default function PriceDisplay({ priceNGN, className }: PriceProps) {
  const { currency, exchangeRates } = useStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return (
      <div
        className={`animate-pulse bg-neutral-100 rounded ${
          className || "h-8 w-24"
        }`}
      />
    );
  }

  const rate = exchangeRates[currency] || 1;
  const markup = currency === "NGN" ? 1 : 1.05;
  const convertedPrice = priceNGN * rate * markup;

  return (
    <p
      className={
        className ||
        "mt-6 font-sans text-2xl text-brand-beryl tracking-tight font-medium"
      }
    >
      {new Intl.NumberFormat(currency === "CAD" ? "en-CA" : "en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(convertedPrice)}
    </p>
  );
}