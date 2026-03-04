"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, ArrowRight, ChevronDown } from "lucide-react";
import { client } from "@/src/lib/sanity";

export default function Footer() {
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
    <footer className="bg-neutral-50 pt-24 pb-12 border-t border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: The "Editorial" Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-32">
          <div className="max-w-md">
            <Link href="/" className="inline-block mb-8 transition-opacity hover:opacity-60">
              <Image 
                src="/logo.png" 
                alt="Dahriola" 
                width={160} 
                height={50} 
                className="h-10 w-auto grayscale brightness-0"
              />
            </Link>
            <p className="font-display text-4xl text-neutral-900 leading-[1.1] lowercase tracking-tighter">
              Precision in every <span className="text-brand-beryl italic">stitch</span>. Vision in every <span className="text-brand-beryl italic">couture</span>.
            </p>
          </div>

          <div className="w-full lg:w-1/3">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 mb-6">
              Join the Dahriola Family
            </p>
            <form className="flex flex-col gap-4 group/form">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="EMAIL ADDRESS"
                  className="w-full bg-transparent border border-neutral-200 pl-6 py-4 text-[11px] tracking-widest focus:outline-none focus:border-brand-beryl transition-all duration-500 placeholder:text-neutral-300"
                />
              </div>
              <button 
                type="submit"
                className="w-fit flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-900 hover:text-brand-beryl transition-all duration-300 group"
              >
                Subscribe 
                <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </form>
          </div>
        </div>

        {/* Middle Section: The Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-16 gap-x-8 pb-12 border-b border-neutral-200">
          
          <div className="space-y-6">
            <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-900">Collections</h5>
            <div className="flex flex-col gap-4">
              <Link href="/category/all" className="text-xs uppercase tracking-widest text-neutral-500 hover:text-brand-beryl hover:translate-x-1 transition-all duration-300 active:opacity-60">Archive</Link>
              
              <div className="relative">
                <button 
                  onClick={() => setIsRtwOpen(!isRtwOpen)}
                  className="text-xs uppercase tracking-widest text-neutral-500 hover:text-brand-beryl flex items-center gap-2 transition-all duration-300 active:opacity-60"
                >
                  Ready to Wear <ChevronDown size={12} className={`transition-transform duration-500 ${isRtwOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-700 ${isRtwOpen ? 'max-h-60 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul className="space-y-3 pl-2 border-l border-brand-beryl/20">
                    {categories.filter((cat: any) => cat.slug !== 'bespoke').map((cat: any) => (
                      <li key={cat.slug}>
                        <Link href={`/category/${cat.slug}`} className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 hover:translate-x-1 transition-all duration-300 block">
                          {cat.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link href="/category/bespoke" className="text-xs uppercase tracking-widest text-neutral-500 hover:text-brand-beryl hover:translate-x-1 transition-all duration-300 active:opacity-60">Bespoke</Link>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-900">The Studio</h5>
            <div className="flex flex-col gap-4">
              <Link href="/about" className="text-xs uppercase tracking-widest text-neutral-500 hover:text-brand-beryl hover:translate-x-1 transition-all duration-300 active:opacity-60">Our Story</Link>
              <Link href="/contact" className="text-xs uppercase tracking-widest text-neutral-500 hover:text-brand-beryl hover:translate-x-1 transition-all duration-300 active:opacity-60">Appointments</Link>
              <Link href="/shipping" className="text-xs uppercase tracking-widest text-neutral-500 hover:text-brand-beryl hover:translate-x-1 transition-all duration-300 active:opacity-60">Care Guide</Link>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-900">Connect</h5>
            <div className="flex flex-col gap-4">
              <a 
                href="https://www.instagram.com/dahriola_/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-brand-beryl hover:translate-x-1 active:scale-95 transition-all duration-300"
              >
                <Instagram size={16} strokeWidth={1.5} />
                <span>Instagram</span>
              </a>
              <a 
                href="https://wa.me/2347065364401" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-brand-beryl hover:translate-x-1 active:scale-95 transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-900">Contact</h5>
            <div className="flex flex-col gap-4 text-xs uppercase tracking-widest text-neutral-400">
              <p>Boutique: Lagos, Nigeria</p>
              <a href="mailto:Info.dahriola@gmail.com" className="hover:text-neutral-900 transition-colors lowercase">Info.dahriola@gmail.com</a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-400 font-bold">
            © {new Date().getFullYear()} Dahriola Store. All Rights Reserved.
          </p>
          <div className="flex gap-12 text-[9px] uppercase tracking-[0.4em] text-neutral-400 font-bold">
             <Link href="/privacy" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link>
             <Link href="/terms" className="hover:text-neutral-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}