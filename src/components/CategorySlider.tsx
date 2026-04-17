"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

const categories = [
  { title: "Skirts", slug: "skirts", image: "/products/skirts/wura-skirt.webp" },
  { title: "Co odds", slug: "co-odds", image: "/products/set/alafia-set/alafia-set-1.webp" },
  { title: "Dresses", slug: "dresses", image: "/products/dresses/new-dress-1.webp" },
  { title: "Jackets", slug: "jackets", image: "/products/jackets/jacket-1.webp" },
  // { title: "Pants", slug: "pants", image: "/products/trousers/trouser-2.webp" },
];

// Double the categories to create the infinite loop effect
const infiniteCategories = [...categories, ...categories];

export default function CategorySlider() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Infinite Soft Glide Logic
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;

    let animationId: number;
    let scrollSpeed = 0.8; // Adjust this number to make it faster or slower

    const scroll = () => {
      if (slider) {
        slider.scrollLeft += scrollSpeed;

        // When we reach the halfway point (the end of the first set), 
        // snap back to the start of the first set instantly.
        if (slider.scrollLeft >= slider.scrollWidth / 2) {
          slider.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    // Pause on hover
    const pause = () => cancelAnimationFrame(animationId);
    const resume = () => animationId = requestAnimationFrame(scroll);

    slider.addEventListener("mouseenter", pause);
    slider.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(animationId);
      slider.removeEventListener("mouseenter", pause);
      slider.removeEventListener("mouseleave", resume);
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative pt-10 pb-44 bg-black overflow-hidden" 
      style={{ clipPath: 'ellipse(150% 100% at 50% 0%)' }}
    >

      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-5 sm:px-8 lg:px-12 pb-10 no-scrollbar"
      >
        {infiniteCategories.map((cat, index) => (
          <Link 
            key={`${cat.slug}-${index}`} 
            href={`/category/${cat.slug}`}
            className={`group relative min-w-[280px] sm:min-w-[350px] aspect-[3/4] overflow-hidden rounded-sm transition-all duration-[1200ms] cubic-bezier(0.22, 1, 0.36, 1)`}
            style={{ 
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.9)',
              transitionDelay: `${(index % categories.length) * 50}ms` 
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
              <h3 className="font-display text-2xl text-white tracking-tight">
                {cat.title}
              </h3>
            </div>
            <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500" />
          </Link>
        ))}
      </div>

      {/* Explore More */}
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