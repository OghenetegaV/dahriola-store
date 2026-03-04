import { client } from "@/src/lib/sanity";
import { notFound } from "next/navigation";
import ProductGallery from "@/src/components/ProductGallery";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import { ChevronRight, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import RelatedProducts from "@/src/components/RelatedProducts";

async function getProduct(slug: string) {
  const query = `*[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    description,
    priceNGN,
    productType,
    allowCustomization,
    images,
    "categoryName": category->title,
    "categoryId": category->_id // Changed this to ensure we get the ID
  }`;
  return await client.fetch(query, { slug });
}

const portableTextComponents = {
  block: {
    // Saturated font color: text-neutral-900
    normal: ({ children }: any) => <p className="mb-6 last:mb-0 leading-[1.8] text-neutral-900 font-light">{children}</p>,
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc ml-5 mb-6 space-y-3 text-neutral-900 font-light">{children}</ul>,
  },
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div className="bg-brand-white min-h-screen">
      {/* 1. Minimal Breadcrumb Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <nav className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-neutral-500 border-b border-neutral-100 pb-6">
            <Link 
            href="/" 
            className="transition-all duration-300 hover:text-brand-beryl hover:tracking-[0.35em] active:scale-95"
            >
            Home
            </Link>
            
            <ChevronRight size={8} className="text-neutral-300" />
            
            <Link 
            href="/category/all" 
            className="transition-all duration-300 hover:text-brand-beryl hover:tracking-[0.35em] active:scale-95"
            >
            Collection
            </Link>
            
            <ChevronRight size={8} className="text-neutral-300" />
            
            <span className="text-brand-beryl font-bold">
            {product.name}
            </span>
        </nav>
        </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-16 items-start">
          
          {/* 2. STICKY Gallery (Takes 7 columns) 
              Locks the image to the screen while text scrolls
          */}
          <div className="lg:col-span-7  lg:top-32 self-start">
            <ProductGallery images={product.images} />
          </div>

          {/* 3. Product Info (Takes 5 columns) */}
          <div className="lg:col-span-5 my-12 lg:mt-0">
            <div className="space-y-8">
              {/* Header */}
              <div>
                <span className="inline-block px-3 py-1 border border-brand-beryl/20 text-[10px] uppercase tracking-widest text-brand-beryl mb-4">
                  {product.productType === 'rtw' ? 'Ready to Wear' : 'Bespoke Studio'}
                </span>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-[1.1]">
                  {product.name}
                </h1>
                {product.productType === 'rtw' && (
                  <p className="mt-6 font-sans text-2xl text-brand-beryl tracking-tight font-medium">
                    ₦{product.priceNGN?.toLocaleString()}
                  </p>
                )}
              </div>

              {/* 4. Description Section with Saturated Ink Font */}
              <div className="pt-8 border-t border-neutral-100">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-900 mb-6">
                  Description
                </h3>
                <div className="text-sm">
                  {Array.isArray(product.description) ? (
                    <PortableText value={product.description} components={portableTextComponents} />
                  ) : (
                    <p className="leading-[1.8] text-neutral-900 font-light">{product.description}</p>
                  )}
                </div>
              </div>

              {/* 5. Action Buttons */}
              <div className="pt-8 space-y-4">
                <button className="group relative w-full overflow-hidden bg-brand-beryl text-white py-6 px-8 transition-all hover:bg-neutral-900 cursor-pointer">
                  <span className="relative z-10 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] font-bold">
                    Place Order <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                
                {product.allowCustomization && (
                  <button className="w-full border border-neutral-200 py-4 text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:border-brand-beryl hover:text-brand-beryl cursor-pointer transition-all italic">
                    Request Custom Measurements
                  </button>
                )}
              </div>

              {/* 6. Trust Badges */}
              <div className="pt-10 grid grid-cols-2 gap-8 border-t border-neutral-100">
                <div className="flex gap-3">
                  <ShieldCheck size={18} strokeWidth={1} className="text-brand-beryl" />
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900 mb-1">Authentic</h4>
                    <p className="text-[10px] text-neutral-500 leading-tight">Hand-finished in Nigeria.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Truck size={18} strokeWidth={1} className="text-brand-beryl" />
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900 mb-1">Global Ship</h4>
                    <p className="text-[10px] text-neutral-500 leading-tight">Lagos to the World.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The Reusable Related Products Component */}
        <RelatedProducts 
          categoryId={product.categoryId} 
          currentProductId={product._id} 
          categoryName={product.categoryName}
        />
      </main>
    </div>
  );
}