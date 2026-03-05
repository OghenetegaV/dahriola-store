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
    <footer className="relative bg-[#0A0A0A] pt-32 pb-12 overflow-hidden border-t border-white/5">
      {/* Background Decorative Element: Large Watermark */}
      <div className="absolute -bottom-10 -right-20 pointer-events-none select-none opacity-[0.02]">
        <h2 className="font-display text-[25vw] leading-none text-white lowercase">
          dahriola
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* 1. Brand & Newsletter Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-20 mb-32">
          <div className="max-w-xl space-y-10">
            <Link href="/" className="inline-block transition-opacity hover:opacity-80">
              <Image 
                src="/logo.png" 
                alt="Dahriola" 
                width={180} 
                height={60} 
                className="h-12 w-auto invert brightness-0" // Ensuring logo shows white on black
              />
            </Link>
            <p className="font-display text-5xl md:text-6xl text-white leading-[1.05] lowercase tracking-tighter">
              Precision in every <span className="text-brand-beryl italic font-light">stitch</span>. <br />
              Vision in every <span className="text-brand-beryl italic font-light">couture</span>.
            </p>
          </div>

          <div className="w-full lg:w-[400px] pt-4">
            <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-neutral-500 mb-8">
              Join the Dahriola Family
            </p>
            <form className="relative group/form">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS"
                className="w-full bg-transparent border-b border-white/10 pb-6 text-[11px] tracking-[0.3em] text-white focus:outline-none focus:border-brand-beryl transition-all duration-700 placeholder:text-neutral-700"
              />
              <button 
                type="submit"
                className="absolute right-0 bottom-6 text-white hover:text-brand-beryl transition-colors group"
              >
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
              </button>
            </form>
            <p className="mt-6 text-[9px] uppercase tracking-widest text-neutral-600">
              By subscribing, you agree to our privacy policy.
            </p>
          </div>
        </div>

        {/* 2. Main Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-20 gap-x-12 pb-24 border-b border-white/5">
          
          {/* Column 1 */}
          <div className="space-y-8">
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Collections</h5>
            <div className="flex flex-col gap-5">
              <Link href="/category/all" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Archive</Link>
              
              <div className="relative">
                <button 
                  onClick={() => setIsRtwOpen(!isRtwOpen)}
                  className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl flex items-center gap-2 transition-all"
                >
                  Ready to Wear <ChevronDown size={12} className={`transition-transform duration-500 ${isRtwOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-700 ${isRtwOpen ? 'max-h-80 mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <ul className="space-y-4 pl-4 border-l border-white/5">
                    {categories.filter((cat: any) => cat.slug !== 'bespoke').map((cat: any) => (
                      <li key={cat.slug}>
                        <Link href={`/category/${cat.slug}`} className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 hover:text-white transition-all block">
                          {cat.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link href="/category/bespoke" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Bespoke</Link>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-8">
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">The Studio</h5>
            <div className="flex flex-col gap-5">
              <Link href="/about" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Our Story</Link>
              <Link href="/contact" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Appointments</Link>
              <Link href="/shipping" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Care Guide</Link>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-8">
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Connect</h5>
            <div className="flex flex-col gap-5">
              <a href="https://instagram.com/dahriola_" target="_blank" className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">
                <Instagram size={14} /> Instagram
              </a>
              <a href="https://wa.me/2347065364401" target="_blank" className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">
                <span className="w-3.5 h-3.5 fill-current">
                   <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </span> 
                WhatsApp
              </a>
            </div>
          </div>

          {/* Column 4 */}
          <div className="space-y-8">
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Inquiry</h5>
            <div className="flex flex-col gap-4 text-[11px] uppercase tracking-widest text-neutral-500 leading-relaxed">
              <p>Lagos, Nigeria</p>
              <a href="mailto:info.dahriola@gmail.com" className="hover:text-white transition-colors lowercase tracking-normal">info.dahriola@gmail.com</a>
              <p className="pt-4 text-[9px] tracking-[0.2em] leading-loose">
                Customer Support <br />
                Mon — Sat, 09:00 — 18:00
              </p>
            </div>
          </div>
        </div>

        {/* 3. Credits Section */}
        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-600 font-bold">
            © {new Date().getFullYear()} Dahriola. Precision Craftsmanship.
          </p>
          <div className="flex gap-10 text-[9px] uppercase tracking-[0.4em] text-neutral-600 font-bold">
             <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
             <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
             <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}