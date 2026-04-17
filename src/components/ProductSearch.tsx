"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import ProductCard from "./ProductCard";

export default function ProductSearch({ products }: { products: any[] }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, products]);

  return (
    <div className="flex flex-col gap-12 w-full">
      {/* SEARCH TRIGGER SECTION (Placed where icons were) */}
      <div className="absolute top-[-80px] right-0 md:top-[-110px] flex items-center justify-end">
        <div className={`flex items-center transition-all duration-500 overflow-hidden ${isSearching ? 'w-[200px] md:w-[300px] border-b border-black' : 'w-10'}`}>
          <input
            type="text"
            placeholder="Search designs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none text-[11px] uppercase tracking-widest w-full py-2 px-2"
            autoFocus={isSearching}
          />
          <button 
            onClick={() => {
                setIsSearching(!isSearching);
                if (isSearching) setQuery("");
            }}
            className="p-2 hover:scale-110 transition-transform"
          >
            {isSearching ? <X size={16} /> : <Search size={18} />}
          </button>
        </div>
      </div>

      {/* GRID SECTION */}
      <main className="flex-1">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-20">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="h-[40vh] flex items-center justify-center border-t border-neutral-100">
            <p className="font-display text-2xl text-neutral-300 lowercase tracking-tighter">
              No results for "{query}"
            </p>
          </div>
        )}
      </main>
    </div>
  );
}