import { client } from "../lib/sanity";
import ProductCard from "../components/ProductCard";
import Hero from "../components/Hero";
import CategorySlider from "../components/CategorySlider";
import AnnouncementBar from "../components/AnnouncementBar";
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
    <div className="relative w-full">
      <AnnouncementBar />
      <Hero />
      <CategorySlider />
      <AboutDahriola />
      <ServicesGrid />

      {/* Featured Collection Preview */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        
        {/* Heading Section - Simplified for Server Component */}
        <div className="relative mb-20 text-center">
          <h2 className="font-display text-5xl md:text-6xl text-neutral-950 lowercase tracking-tighter relative z-10 pb-4">
            the <span className="italic font-light">latest</span> pieces
          </h2>
          {/* Static Brush Stroke */}
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-6 bg-no-repeat bg-contain bg-center z-0 opacity-20"
            style={{ 
              backgroundImage: "url('/images/brush-stroke-green.svg')", 
            }}
          />
        </div>

        {/* The Grid - Fixed closing tags and mapping */}
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