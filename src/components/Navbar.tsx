"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Menu, Phone, X, ChevronDown, Instagram } from "lucide-react";
import { client } from "@/src/lib/sanity";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isRtwOpen, setIsRtwOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await client.fetch(`*[_type == "category"]{ title, "slug": slug.current }`);
      setCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full border-b-[1.2px] border-brand-laurel/30 bg-brand-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">
          
          {/* LEFT: Desktop Navigation Links with Dropdown */}
          <div className="hidden lg:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-600">
            
            {/* RTW Dropdown Container */}
            <div className="relative group py-4 cursor-pointer">
              <Link href="/category/rtw" className="flex items-center gap-1 hover:text-brand-beryl transition-colors">
                Ready to Wear <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
              </Link>

              {/* Desktop Frosted Dropdown */}
              <div className="absolute left-0 top-full pt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-[110]">
                <div className="bg-white/95 backdrop-blur-2xl border border-neutral-100 shadow-2xl py-6 min-w-[220px] rounded-sm">
                  <Link href="/category/rtw" className="block px-8 py-3 text-[9px] text-brand-beryl hover:pl-10 transition-all tracking-[0.3em] uppercase font-bold">
                    View All RTW //
                  </Link>
                  <div className="h-[1px] bg-neutral-900/5 my-3 mx-8" />
                  
                  {categories
                    .filter((cat: any) => cat.slug !== 'bespoke')
                    .map((cat: any) => (
                      <Link 
                        key={cat.slug} 
                        href={`/category/${cat.slug}`}
                        className="block px-8 py-3 text-[10px] tracking-[0.2em] text-neutral-500 hover:text-brand-beryl hover:pl-10 transition-all"
                      >
                        {cat.title}
                      </Link>
                    ))
                  }
                </div>
              </div>
            </div>

            <Link href="/category/bespoke" className="hover:text-brand-beryl transition-colors">
              Bespoke
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 lg:hidden text-brand-beryl" 
            aria-label="Open Menu"
          >
            <Menu strokeWidth={1.2} size={26} />
          </button>

          {/* CENTER: Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 transition-opacity hover:opacity-80">
            <Image 
              src="/logo.png" 
              alt="Dahriola Logo" 
              width={140} 
              height={40} 
              className="h-8 w-auto object-contain md:h-10"
              priority
            />
          </Link>

          {/* RIGHT: Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/contact" className="p-2 text-brand-beryl hidden sm:block" title="Contact Tailor">
              <Phone strokeWidth={1.2} size={20} />
            </Link>
            <button className="relative p-2 text-brand-beryl" aria-label="Cart">
              <ShoppingBag strokeWidth={1.2} size={22} />
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-sage text-[10px] text-white font-bold">
                0
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-[120] bg-neutral-950/40 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Sidebar Menu */}
      <aside className={`fixed top-0 left-0 z-[130] h-full w-[85%] max-w-sm bg-brand-white p-8 shadow-2xl transition-transform duration-500 ease-in-out lg:hidden ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <Image src="/logo.png" alt="Dahriola" width={100} height={30} className="h-6 w-auto" />
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 p-2">
              <X size={24} strokeWidth={1} />
            </button>
          </div>

          <nav className="flex flex-col gap-8">
            <Link href="/category/all" onClick={() => setIsOpen(false)} className="font-display text-2xl text-neutral-900 lowercase tracking-tighter">
              the collection
            </Link>

            <div className="flex flex-col">
              <button 
                onClick={() => setIsRtwOpen(!isRtwOpen)}
                className="flex items-center justify-between font-display text-2xl text-neutral-900 lowercase tracking-tighter border-b border-neutral-100 pb-2"
              >
                ready to wear 
                <ChevronDown size={20} className={`transition-transform duration-300 ${isRtwOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-500 ${isRtwOpen ? 'max-h-[500px] mt-6' : 'max-h-0'}`}>
                <div className="flex flex-col gap-5 pl-4 border-l border-brand-beryl/20">
                  <Link href="/category/rtw" onClick={() => setIsOpen(false)} className="text-[11px] uppercase tracking-[0.3em] text-brand-beryl font-bold">
                    View All RTW //
                  </Link>
                  {categories.filter((cat: any) => cat.slug !== 'bespoke').map((cat: any) => (
                    <Link key={cat.slug} href={`/category/${cat.slug}`} onClick={() => setIsOpen(false)} className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-900 transition-colors">
                      {cat.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/category/bespoke" onClick={() => setIsOpen(false)} className="font-display text-2xl text-neutral-900 lowercase tracking-tighter">
              bespoke studio
            </Link>

            <Link href="/contact" onClick={() => setIsOpen(false)} className="font-display text-2xl text-neutral-900 lowercase tracking-tighter">
              contact us
            </Link>
          </nav>

          <div className="mt-auto pt-10">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-6">Follow our journey</p>
            <div className="flex gap-8 items-center">
              <a href="https://instagram.com/dahriola" target="_blank" className="text-neutral-800 hover:text-brand-beryl transition-colors">
                <Instagram strokeWidth={1.2} size={22} />
              </a>
              <a href="https://wa.me/2347065364401" target="_blank" className="text-neutral-800 hover:text-brand-beryl transition-colors">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


              