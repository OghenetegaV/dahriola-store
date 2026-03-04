"use client";

import Link from "next/link";
import { ShoppingBag, Menu, Phone } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b-[1.2px] border-brand-laurel/30 bg-brand-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Menu Trigger */}
        <button className="p-2 lg:hidden text-brand-beryl" aria-label="Menu">
          <Menu strokeWidth={1.2} size={24} />
        </button>

        {/* Logo - Centered for Luxury feel */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="font-display text-2xl tracking-[0.2em] text-brand-beryl uppercase">
            Dahriola
          </h1>
        </Link>

        {/* Action Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/contact" className="p-2 text-brand-beryl hidden sm:block" title="Contact Tailor">
            <Phone strokeWidth={1.2} size={20} />
          </Link>
          <button className="relative p-2 text-brand-beryl" aria-label="Cart">
            <ShoppingBag strokeWidth={1.2} size={22} />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-sage text-[10px] text-white">
              0
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

