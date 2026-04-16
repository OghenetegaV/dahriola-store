import ProductCard from "./ProductCard";

interface FeaturedProductsProps {
  products: any[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section 
      className="relative py-12 px-4 bg-no-repeat bg-fixed bg-center transition-all duration-1000"
    >
      {/* To increase image opacity, we reduce the opacity of this white overlay. 
          bg-white/20 makes the image very clear. 
          bg-white/0 (or removing it) makes the image 100% opaque.
      */}
      <div className="absolute inset-0 bg-white/0 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
          {products.map((product: any, index: number) => (
            <ProductCard 
              key={product._id} 
              product={{...product, priority: index < 3}} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}