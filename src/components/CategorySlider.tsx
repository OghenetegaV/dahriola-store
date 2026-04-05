"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

const categories = [
  { title: "Skirts", slug: "skirts", image: "/bespoke2.jpg" },
  { title: "Shorts", slug: "shorts", image: "/D-1.jpg" },
  { title: "Dresses", slug: "dresses", image: "/bespoke.jpg" },
  { title: "Linen Pieces", slug: "linen-pieces", image: "/D-40.jpg" },
  { title: "Shirt Dresses", slug: "shirt-dresses", image: "/agbada_2.jpg" },
  { title: "Pants", slug: "pants", image: "/D-34.jpg" },
  { title: "Bubu", slug: "bubu", image: "/kimono.png" },
];

export default function CategorySlider() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Run only once
        }
      },
      { threshold: 0.1 } // Triggers when 10% of the section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative pt-20 pb-44 bg-black overflow-hidden" 
      style={{ clipPath: 'ellipse(150% 100% at 50% 0%)' }}
    >
      {/* Header Section
      <div className={`px-5 sm:px-8 lg:px-12 mb-10 flex items-end justify-between transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-brand-beryl font-bold">Explore</span>
          <h2 className="font-display text-4xl sm:text-5xl text-white lowercase tracking-tighter mt-2">
            The Collections
          </h2>
        </div>
        <Link href="/category/all" className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors pb-1 border-b border-neutral-800">
          View All
        </Link>
      </div> */}

      {/* Scrollable Container */}
      <div className="flex gap-4 overflow-x-auto px-5 sm:px-8 lg:px-12 pb-10 no-scrollbar snap-x snap-mandatory">
        {categories.map((cat, index) => (
          <Link 
            key={cat.slug} 
            href={`/category/${cat.slug}`}
            className={`group relative min-w-[280px] sm:min-w-[350px] aspect-[3/4] overflow-hidden rounded-sm snap-start transition-all duration-[1200ms] cubic-bezier(0.22, 1, 0.36, 1)`}
            style={{ 
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.9)',
              transitionDelay: `${index * 100}ms` 
            }}
          >
            <Image
              src={cat.image}
              alt={cat.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            
            <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <p className="text-[10px] uppercase tracking-[0.4em] text-brand-beryl mb-1 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                Discover
              </p>
              <h3 className="font-display text-2xl text-white lowercase tracking-tight">
                {cat.title}
              </h3>
            </div>
            <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
          </Link>
        ))}
      </div>

      {/* Explore More - Bottom of Curve */}
      <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-1000 delay-[1000ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-[9px] uppercase tracking-[0.4em] text-neutral-500 font-medium">
          Explore More
        </span>
        <div className="animate-bounce-slow text-brand-beryl">
          <ChevronDown size={50} strokeWidth={1.5} />
        </div>
      </div>
    </section>
  );
}