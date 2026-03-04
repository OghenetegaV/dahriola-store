import Link from "next/link";
import { client } from "../lib/sanity";
import ProductCard from "../components/ProductCard"; // Import the smart component

async function getProducts() {
  // We defined(images) in Sanity, but we fetch all of them for the hover effect
  const query = `*[_type == "product" && defined(images)] | order(_createdAt desc) [0...4] {
    _id,
    name,
    "slug": slug.current,
    productType,
    priceNGN,
    images, // Fetch the full array
    "categoryName": category->title
  }`;

  const data = await client.fetch(query);
  return data;
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="relative w-full">
      {/* Editorial Hero Section 
        (Keep this section code exactly as you like it)
      */}
      <section className="relative h-[85vh] w-full overflow-hidden bg-neutral-100">
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-xs tracking-[0.3em] text-brand-beryl uppercase font-medium">
            New Arrival
          </span>
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl text-neutral-800 mb-8 leading-tight">
            The Art of <br /> Dressing Well
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/shop" className="px-10 py-4 bg-brand-beryl text-white btn-premium">
              Shop Ready-to-Wear
            </Link>
            <Link href="/bespoke" className="px-10 py-4 border border-brand-beryl text-brand-beryl btn-premium hover:bg-brand-sage/10">
              Bespoke Inquiry
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collection Preview (Keep styling) */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h3 className="font-display text-4xl">Latest Drops</h3>
            <p className="text-neutral-500 text-sm mt-2 font-light italic">Elegance in every stitch.</p>
          </div>
          <Link href="/shop" className="text-xs uppercase tracking-widest border-b border-neutral-300 pb-1 hover:text-brand-beryl transition-colors">
            View All
          </Link>
        </div>
        
        {/* The Grid - Keep styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
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