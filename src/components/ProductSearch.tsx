"use client";

import { useState, useMemo } from "react";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import ProductCard from "./ProductCard";
import { useStore } from "@/src/store/useStore";

export default function ProductSearch({ products }: { products: any[] }) {
  const { currency, exchangeRates } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const [priceRange, setPriceRange] = useState<{min?: number, max?: number} | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const formatPrice = (val: number) => {
    const converted = val * (exchangeRates[currency] || 1);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumSignificantDigits: 3,
    }).format(converted);
  };

  const rangesNGN = [
    { label: "All Prices", value: null },
    { label: "Under", max: 50000 },
    { min: 50000, max: 100000 },
    { min: 100000, max: 200000 },
    { label: "Above", min: 200000 },
  ];

  const processedProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (priceRange) {
      if (priceRange.min !== undefined) result = result.filter(p => p.priceNGN >= priceRange.min!);
      if (priceRange.max !== undefined) result = result.filter(p => p.priceNGN <= priceRange.max!);
    }

    if (sortBy === "Price: Low to High") result.sort((a, b) => a.priceNGN - b.priceNGN);
    if (sortBy === "Price: High to Low") result.sort((a, b) => b.priceNGN - a.priceNGN);
    if (sortBy === "Newest") result.sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());

    return result;
  }, [searchQuery, products, priceRange, sortBy]);

  return (
    <div className="flex-1">
      {/* 1. DESKTOP UTILS (Hidden on Mobile) */}
      <div className="hidden md:flex absolute top-[-95px] right-0 items-center justify-end gap-6 z-20">
        <div className="flex items-center">
          <div className={`flex items-center transition-all duration-500 overflow-hidden ${isSearchOpen ? 'w-[220px] border-b border-black/20' : 'w-0'}`}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-[10px] uppercase tracking-widest w-full px-2 py-1"
            />
          </div>
          <button onClick={() => { setIsSearchOpen(!isSearchOpen); setSearchQuery(""); }} className="p-2">
            {isSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
        </div>

        {/* Price Dropdown (Desktop) */}
        <div className="relative group cursor-pointer">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-5 py-2.5 rounded-full hover:bg-neutral-50 transition-all">
            {priceRange ? "Filtered" : "Price"} <ChevronDown size={12} />
          </div>
          <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-100 shadow-2xl rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            {rangesNGN.map((range, i) => (
              <div key={i} onClick={() => setPriceRange(range.value === null ? null : {min: range.min, max: range.max})} className="py-2 text-[10px] uppercase tracking-wider text-neutral-600 hover:text-black cursor-pointer border-b border-neutral-50 last:border-0">
                {range.label === "All Prices" ? "Show All" : range.label === "Under" ? `Under ${formatPrice(range.max!)}` : range.label === "Above" ? `Above ${formatPrice(range.min!)}` : `${formatPrice(range.min!)} — ${formatPrice(range.max!)}`}
              </div>
            ))}
          </div>
        </div>

        {/* Sort Dropdown (Desktop) */}
        <div className="relative group cursor-pointer">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 px-5 py-2.5 rounded-full hover:bg-neutral-50 transition-all">
            {sortBy} <ChevronDown size={12} />
          </div>
          <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-100 shadow-2xl rounded-xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            {["Newest", "Price: Low to High", "Price: High to Low"].map((option) => (
              <div key={option} onClick={() => setSortBy(option)} className="px-6 py-2.5 text-[10px] uppercase tracking-wider text-neutral-500 hover:text-black hover:bg-neutral-50">
                {option}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MOBILE UTILS (Visible only on Mobile) */}
      <div className="md:hidden mb-5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative flex items-center border-b border-neutral-200">
            <Search size={13} className="text-neutral-400" />

            <input
              type="text"
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-[10px] uppercase tracking-widest w-full py-2.5 px-2"
            />

            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}>
                <X size={13} className="text-neutral-400" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className={`shrink-0 h-9 px-3 rounded-full border text-[9px] font-bold uppercase tracking-widest transition ${
              isMobileFiltersOpen
                ? "bg-black text-white border-black"
                : "bg-white text-black border-neutral-300"
            }`}
          >
            {isMobileFiltersOpen ? "Close" : "Filter/Sort"}
          </button>
        </div>

        {isMobileFiltersOpen && (
          <div className="mt-3 rounded-full border border-neutral-200 bg-white px-3 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <select
              className="flex-1 bg-transparent text-[9px] uppercase font-bold tracking-widest outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {["Newest", "Price: Low to High", "Price: High to Low"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <div className="h-5 w-px bg-neutral-200" />

            <select
              className="flex-1 bg-transparent text-[9px] uppercase font-bold tracking-widest outline-none"
              value={JSON.stringify(
                priceRange === null
                  ? null
                  : { min: priceRange.min, max: priceRange.max }
              )}
              onChange={(e) => {
                const val = JSON.parse(e.target.value);
                setPriceRange(val);
              }}
            >
              {rangesNGN.map((r, i) => (
                <option
                  key={i}
                  value={JSON.stringify(
                    r.value === null ? null : { min: r.min, max: r.max }
                  )}
                >
                  {r.label === "All Prices"
                    ? "All Prices"
                    : r.label === "Under"
                    ? `Under ${formatPrice(r.max!)}`
                    : r.label === "Above"
                    ? `Above ${formatPrice(r.min!)}`
                    : `${formatPrice(r.min!)} - ${formatPrice(r.max!)}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. THE GRID */}
      {processedProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-20">
          {processedProducts.map((product: any) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="h-[40vh] flex items-center justify-center border-t border-neutral-100">
          <p className="font-display text-2xl text-neutral-300 lowercase tracking-tighter">no results found.</p>
        </div>
      )}
    </div>
  );
}