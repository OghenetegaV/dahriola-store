"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Menu, Phone, X, ChevronDown, Instagram, Globe } from "lucide-react";
import { client } from "@/src/lib/sanity";
import { useStore } from "@/src/store/useStore";
import CartDrawer from "./CartDrawer"; // Assuming you've created this component

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isRtwOpen, setIsRtwOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Pulling from Zustand Store
  const { cart, currency, setCurrency } = useStore();

  useEffect(() => {
    setHasHydrated(true);
    const fetchCategories = async () => {
      const data = await client.fetch(`*[_type == "category"]{ title, "slug": slug.current }`);
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b-[1.2px] border-brand-laurel/30 bg-brand-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">
          
          {/* LEFT: Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-600">
            <div className="relative group py-4 cursor-pointer">
              <Link href="/category/rtw" className="flex items-center gap-1 hover:text-brand-beryl transition-colors">
                Ready to Wear <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
              </Link>

              <div className="absolute left-0 top-full pt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[110]">
                <div className="bg-white/95 backdrop-blur-2xl border border-neutral-100 shadow-2xl py-6 min-w-[220px] rounded-sm">
                  <Link href="/category/rtw" className="block px-8 py-3 text-[9px] text-brand-beryl hover:pl-10 transition-all tracking-[0.3em] uppercase font-bold">
                    View All RTW //
                  </Link>
                  <div className="h-[1px] bg-neutral-900/5 my-3 mx-8" />
                  {categories.filter((cat: any) => cat.slug !== 'bespoke').map((cat: any) => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`} className="block px-8 py-3 text-[10px] tracking-[0.2em] text-neutral-500 hover:text-brand-beryl hover:pl-10 transition-all">
                      {cat.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/category/bespoke" className="hover:text-brand-beryl transition-colors">
              Bespoke
            </Link>

            {/* Currency Selector (Desktop) */}
            <div className="relative group py-4 cursor-pointer ml-4">
              <div className="flex items-center gap-1 hover:text-brand-beryl transition-colors">
                <Globe size={12} className="text-brand-beryl" />
                <span>{currency}</span>
                <ChevronDown size={8} />
              </div>
              <div className="absolute left-0 top-full pt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[110]">
                <div className="bg-white/95 backdrop-blur-2xl border border-neutral-100 shadow-xl py-2 min-w-[100px] rounded-sm">
                  {['NGN', 'USD', 'GBP', 'EUR'].map((cur) => (
                    <button
                      key={cur}
                      onClick={() => setCurrency(cur as any)}
                      className={`block w-full text-left px-6 py-2 text-[9px] tracking-widest hover:bg-neutral-50 ${currency === cur ? 'text-brand-beryl font-black' : 'text-neutral-500'}`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setIsOpen(true)} className="p-2 lg:hidden text-brand-beryl">
            <Menu strokeWidth={1.2} size={26} />
          </button>

          {/* CENTER: Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 transition-opacity hover:opacity-80">
            <Image src="/logo.png" alt="Dahriola Logo" width={140} height={40} className="h-8 w-auto object-contain md:h-10" priority />
          </Link>

          {/* RIGHT: Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/contact" className="p-2 text-brand-beryl hidden sm:block">
              <Phone strokeWidth={1.2} size={20} />
            </Link>
            
            {/* Active Shopping Bag */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-brand-beryl transition-transform active:scale-90" 
              aria-label="Cart"
            >
              <ShoppingBag strokeWidth={1.2} size={22} />
              {hasHydrated && totalItems > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-beryl text-[9px] text-white font-bold animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Cart Drawer Component */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Mobile Sidebar Menu (Added Currency Selector here too) */}
      <aside className={`fixed top-0 left-0 z-[130] h-full w-[85%] max-w-sm bg-brand-white p-8 shadow-2xl transition-transform duration-500 ease-in-out lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <Image src="/logo.png" alt="Dahriola" width={100} height={30} className="h-6 w-auto" />
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 p-2"><X size={24} strokeWidth={1} /></button>
          </div>

          <nav className="flex flex-col gap-8">
            <Link href="/category/all" onClick={() => setIsOpen(false)} className="font-display text-2xl text-neutral-900 lowercase tracking-tighter">the collection</Link>
            
            <div className="flex flex-col">
              <button onClick={() => setIsRtwOpen(!isRtwOpen)} className="flex items-center justify-between font-display text-2xl text-neutral-900 lowercase tracking-tighter border-b border-neutral-100 pb-2">
                ready to wear <ChevronDown size={20} className={`transition-transform duration-300 ${isRtwOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-500 ${isRtwOpen ? 'max-h-[500px] mt-6' : 'max-h-0'}`}>
                <div className="flex flex-col gap-5 pl-4 border-l border-brand-beryl/20">
                  <Link href="/category/rtw" onClick={() => setIsOpen(false)} className="text-[11px] uppercase tracking-[0.3em] text-brand-beryl font-bold">View All RTW //</Link>
                  {categories.filter((cat: any) => cat.slug !== 'bespoke').map((cat: any) => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={() => setIsOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{cat.title}</Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/category/bespoke" onClick={() => setIsOpen(false)} className="font-display text-2xl text-neutral-900 lowercase tracking-tighter">bespoke studio</Link>

            {/* Mobile Currency Toggle */}
            <div className="flex gap-4 mt-4 py-4 border-t border-neutral-100">
              {['NGN', 'USD', 'GBP', 'EUR'].map((cur) => (
                <button 
                  key={cur} 
                  onClick={() => setCurrency(cur as any)}
                  className={`text-[10px] font-bold tracking-widest ${currency === cur ? 'text-brand-beryl' : 'text-neutral-300'}`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-auto pt-10">
            <div className="flex gap-8 items-center">
              <a href="https://instagram.com/dahriola_" target="_blank" className="text-neutral-800"><Instagram strokeWidth={1.2} size={22} /></a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}