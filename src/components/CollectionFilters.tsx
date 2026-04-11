"use client";

import { useState } from "react";
import { useStore } from "@/src/store/useStore";
import { ChevronDown, Grid, List } from "lucide-react";

export default function CollectionFilters() {
  const { currency, exchangeRates } = useStore();
  
  // Define base ranges in NGN
  const rangesNGN = [
    { label: "Under", value: 50000 },
    { label: "", min: 50000, max: 100000 },
    { label: "", min: 100000, max: 200000 },
    { label: "Above", value: 200000 },
  ];

  const formatPrice = (val: number) => {
    const converted = val * (exchangeRates[currency] || 1);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumSignificantDigits: 3,
    }).format(converted);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Price Filter Dropdown */}
      <div className="relative group cursor-pointer">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-5 py-3 rounded-full hover:bg-neutral-50 transition-all">
          Filter by Price <ChevronDown size={12} />
        </div>
        <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-100 shadow-2xl rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <p className="text-[9px] uppercase tracking-widest text-neutral-400 mb-4 font-bold">Select Range ({currency})</p>
          <div className="space-y-1">
            {rangesNGN.map((range, i) => (
              <div key={i} className="py-2 text-[10px] uppercase tracking-wider text-neutral-600 hover:text-black cursor-pointer transition-colors border-b border-neutral-50 last:border-0">
                {range.label === "Under" && `Under ${formatPrice(range.value!)}`}
                {range.label === "Above" && `Above ${formatPrice(range.value!)}`}
                {range.min && `${formatPrice(range.min)} — ${formatPrice(range.max!)}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="relative group cursor-pointer">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-5 py-3 rounded-full hover:bg-neutral-50 transition-all">
          Sort: Newest <ChevronDown size={12} />
        </div>
        <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-100 shadow-2xl rounded-xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          {["Newest", "Popularity", "Price: Low to High", "Price: High to Low"].map((option) => (
            <div key={option} className="px-6 py-2.5 text-[10px] uppercase tracking-wider text-neutral-500 hover:text-black hover:bg-neutral-50 cursor-pointer transition-colors">
              {option}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3 border-l border-neutral-200 pl-6 ml-2 text-neutral-300">
        <Grid size={16} className="text-black cursor-pointer" />
        <List size={16} className="cursor-pointer hover:text-black transition-colors" />
      </div>
    </div>
  );
}