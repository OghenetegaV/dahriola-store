"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, ArrowRight, ChevronDown } from "lucide-react";
import { client } from "@/src/lib/sanity";
import PolicyModal from "./PolicyModal";
import { POLICIES } from "@/src/constants/policies";

export default function Footer() {
  const [categories, setCategories] = useState([]);
  const [isRtwOpen, setIsRtwOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activePolicy, setActivePolicy] = useState<null | keyof typeof POLICIES>(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await client.fetch(`*[_type == "category"]{ title, "slug": slug.current }`);
      setCategories(data);
    };
    fetchCategories();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0 }
    );

    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="relative pt-64 pb-12 overflow-hidden bg-white">
      {/* 1. Animated Background Layer (The Dark Slide-up) */}
      <div 
        className="absolute inset-0 bg-[#0A0A0A] transition-all duration-[1500ms] ease-[cubic-bezier(0.22, 1, 0.36, 1)]"
        style={{ 
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(100px)'
        }}
      />

      {/* 2. Top Center "Thanks" Text */}
      <div 
        className={`absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-all duration-[1200ms] delay-500 z-10 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <p className="text-2xl">💚</p>
        <p className="text-[11px] tracking-[0.6em] text-neutral-400 font-bold text-center uppercase">
          Thank you for shopping with us
        </p>
        <div className="h-[1px] w-12 bg-brand-beryl/40" />
      </div>

      {/* Background Watermark */}
      <div className={`absolute -bottom-10 -right-10 pointer-events-none select-none transition-opacity duration-1000 delay-[1200ms] ${isVisible ? 'opacity-[0.02]' : 'opacity-0'}`}>
        <h2 className="font-display text-[18vw] leading-none text-white uppercase">
          dahriola
        </h2>
      </div>

      {/* 3. Main Content Container */}
      <div className={`max-w-7xl mx-auto px-6 lg:px-12 relative z-10 transition-all duration-[1200ms] delay-[800ms] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
      }`}>
        
        {/* Brand & Newsletter */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-20 mb-32">
          <div className="max-w-xl space-y-10">
            <Link href="/" className="inline-block transition-opacity hover:opacity-80">
              <Image 
                src="/logo.png" 
                alt="Dahriola" 
                width={180} 
                height={60} 
                className="h-12 w-auto invert brightness-0" 
              />
            </Link>
            <p className="font-display text-5xl md:text-6xl text-white leading-[1.05] lowercase tracking-tighter">
              Precision in every <span className="text-brand-beryl italic font-light">stitch</span>. <br />
              Vision in every <span className="text-brand-beryl italic font-light">couture</span>.
            </p>
          </div>

          <div className="w-full lg:w-[400px] pt-4">
            <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-neutral-500 mb-8">
              Join the Inner Circle
            </p>
            <form className="relative group/form" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS"
                className="w-full bg-transparent border-b border-white/10 pb-6 text-[11px] tracking-[0.3em] text-white focus:outline-none focus:border-brand-beryl transition-all duration-700 placeholder:text-neutral-700"
              />
              <button type="submit" className="absolute right-0 bottom-6 text-white hover:text-brand-beryl transition-colors group">
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
              </button>
            </form>
            <p className="mt-6 text-[9px] uppercase tracking-widest text-neutral-600">
              By subscribing, you agree to our privacy policy.
            </p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-20 gap-x-12 pb-24 border-b border-white/5">
          
          <div className="space-y-8">
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Collections</h5>
            <div className="flex flex-col gap-5">
              <Link href="/" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Home</Link>
              
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

              <Link href="/bespoke" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Bespoke</Link>
            </div>
          </div>

          <div className="space-y-8">
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">The Studio</h5>
            <div className="flex flex-col gap-5">
              <Link href="/our-story" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Our Story</Link>
              <Link href="/bespoke" className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">Appointments</Link>
              <button 
                onClick={() => setActivePolicy('shipping')} 
                className="text-left text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all"
              >
                Shipping Guide
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <h5 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Connect</h5>
            <div className="flex flex-col gap-5">
              <a href="https://instagram.com/dahriola_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">
                <Instagram size={14} /> Instagram
              </a>
              <a href="https://wa.me/2347069996877" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-brand-beryl transition-all">
                <span className="w-3.5 h-3.5 fill-current">
                   <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </span> 
                WhatsApp
              </a>
            </div>
          </div>

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

        {/* Credits & Interactive Policy Links */}
        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] uppercase tracking-[0.4em] text-neutral-600 font-bold">
          <p>© {new Date().getFullYear()} Dahriola.</p>
          <div className="flex gap-10">
            <button 
              onClick={() => setActivePolicy('shipping')} 
              className="hover:text-white transition-colors uppercase tracking-[0.4em]"
            >
              Shipping
            </button>
            <button 
              onClick={() => setActivePolicy('returns')} 
              className="hover:text-white transition-colors uppercase tracking-[0.4em]"
            >
              Returns
            </button>
            <button 
              onClick={() => setActivePolicy('privacy')} 
              className="hover:text-white transition-colors uppercase tracking-[0.4em]"
            >
              Privacy
            </button>
          </div>
        </div>
      </div>

      {/* Policy Modal Injection */}
      <PolicyModal 
        isOpen={!!activePolicy} 
        onClose={() => setActivePolicy(null)}
        title={activePolicy ? POLICIES[activePolicy].title : ""}
        content={activePolicy ? POLICIES[activePolicy].content : []}
      />
    </footer>
  );
}