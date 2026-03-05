import Link from "next/link";
import Image from "next/image";
import { client } from "../lib/sanity";
import ProductCard from "../components/ProductCard";
import Hero from "../components/Hero";

async function getProducts() {
  const query = `*[_type == "product" && defined(images)] | order(_createdAt desc) [0...6] {
    _id,
    name,
    "slug": slug.current,
    productType,
    priceNGN,
    images,
    "categoryName": category->title
  }`;

  const data = await client.fetch(query);
  return data;
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="relative w-full bg-brand-white">
      {/* Dynamic Editorial Hero */}
      <Hero />

      {/* Featured Collection Preview */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-6">
          <div>
            {/* <span className="text-[10px] uppercase tracking-[0.4em] text-brand-beryl font-bold block mb-4">
              The Selection
            </span> */}
            <h3 className="font-display text-3xl md:text-4xl lowercase tracking-tighter">
              Latest Drops
            </h3>
            <p className="text-neutral-500 text-xs mt-4 font-light uppercase tracking-widest">
              Precision in every stitch. Vision in every couture.
            </p>
          </div>
          
          <Link 
            href="/category/all" 
            className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold pb-1 border-b border-neutral-200 hover:border-brand-beryl transition-all"
          >
            View Full Collection
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        
        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
          {products.map((product: any, index: number) => (
            <ProductCard 
              key={product._id} 
              product={{...product, priority: index < 3}} 
            />
          ))}
        </div>
      </section>

      {/* Bespoke CTA Section with Fabric Background */}
      <section className="relative h-[500px] w-full overflow-hidden flex items-center justify-center">
        {/* Background Image with Blur */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/fabric.jpg"
            alt="Fabric texture"
            fill
            className="object-cover scale-100"
          />
          {/* Overlay to ensure text stands out */}
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h4 className="font-display text-4xl md:text-6xl lowercase mb-8 text-white tracking-tighter">
            need a <span className="italic text-brand-beryl">unique</span> outfit?
          </h4>
          <p className="text-white/80 text-sm mb-10 max-w-md mx-auto font-light leading-relaxed">
            Whether it&apos;s a dream design or a special occasion, let&apos;s create something that is uniquely yours.
          </p>
          <Link 
            href="/bespoke" 
            className="inline-block bg-white text-neutral-900 text-[10px] uppercase tracking-[0.4em] px-12 py-5 rounded-full hover:bg-brand-beryl hover:text-white transition-all active:scale-95"
          >
            Start Bespoke Inquiry
          </Link>
        </div>
      </section>
    </div>
  );
}