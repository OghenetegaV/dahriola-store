"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function CategoryDropdown({ categories, currentSlug }: { categories: any[], currentSlug: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] font-bold text-brand-beryl bg-brand-beryl/5 px-2 py-1 rounded-full"
      >
        Select Category <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-48 bg-white shadow-xl border border-neutral-100 z-50 py-2 rounded-sm">
            <Link 
              href="/category/all" 
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 text-[10px] uppercase tracking-widest ${currentSlug === 'all' ? 'bg-neutral-50 font-bold' : 'text-neutral-500'}`}
            >
              All Collection
            </Link>
            {categories.map((cat) => (
              <Link 
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 text-[10px] uppercase tracking-widest ${currentSlug === cat.slug ? 'bg-neutral-50 font-bold' : 'text-neutral-500'}`}
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}