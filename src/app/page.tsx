import Link from "next/link";
import Image from "next/image";
import { client } from "../lib/sanity";
import ProductCard from "../components/ProductCard";
import Hero from "../components/Hero";
import CategorySlider from "../components/CategorySlider";
import AnnouncementBar from "../components/AnnouncementBar";
import BrandEthos from "../components/BrandEthos";
import AboutDahriola from "../components/AboutDahriola";
import ServicesGrid from "../components/ServicesGrid";

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
    <div className="relative w-full ">
      {/* Dynamic Editorial Hero */}
      <AnnouncementBar />
      <Hero />
      <CategorySlider />
      {/* <BrandEthos /> */}
      <AboutDahriola />
      <ServicesGrid />

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

      
    </div>
  );
}