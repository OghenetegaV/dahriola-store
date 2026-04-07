import ProductCard from "./ProductCard";

interface FeaturedProductsProps {
  products: any[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section 
      className="relative py-32 px-4 bg-no-repeat bg-fixed bg-center transition-all duration-1000"
      style={{ 
        backgroundImage: "url('/images/patterned-g.jpg')", 
        backgroundSize: "cover", // Changed from 400px to cover for a single large image
      }}
    >
      {/* To increase image opacity, we reduce the opacity of this white overlay. 
          bg-white/20 makes the image very clear. 
          bg-white/0 (or removing it) makes the image 100% opaque.
      */}
      <div className="absolute inset-0 bg-white/0 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading Section */}
        <div className="relative mb-20 text-center">
          <h2 className="font-display text-5xl md:text-6xl text-neutral-950 lowercase tracking-tighter relative z-10 pb-4">
            shop our <span className="italic font-light">latest</span> pieces
          </h2>
          {/* Static Brush Stroke */}
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-52 h-6 bg-no-repeat bg-contain bg-center z-0 opacity-70"
            style={{ 
              backgroundImage: "url('/images/brush-stroke-green.svg')", 
            }}
          />
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
      </div>
    </section>
  );
}