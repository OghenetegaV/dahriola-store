import Link from "next/link";
import ProductCard from "./ProductCard";

interface FeaturedProductsProps {
  products: any[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  // Take only the first 3 products from the array
  const displayedProducts = products.slice(0, 3);

  return (
    <section 
      className="relative py-24 px-4 bg-no-repeat bg-fixed bg-center transition-all duration-1000"
    >
      <div className="absolute inset-0 bg-white/0 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
          {displayedProducts.map((product: any, index: number) => (
            <ProductCard 
              key={product._id} 
              product={{...product, priority: index < 3}} 
            />
          ))}
        </div>

        {/* View More Link */}
        <div className="mt-16 flex justify-center">
          <Link 
            href="/category/all" 
            className="group flex flex-col items-center gap-2"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 group-hover:text-brand-beryl transition-colors">
              View More
            </span>
            <div className="h-[1px] w-8 bg-neutral-200 group-hover:w-16 group-hover:bg-brand-beryl transition-all duration-500" />
          </Link>
        </div>
      </div>
    </section>
  );
}