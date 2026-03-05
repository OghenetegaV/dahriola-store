import { client } from "@/src/lib/sanity";
import { notFound } from "next/navigation";
import ProductGallery from "@/src/components/ProductGallery";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Truck, Ruler } from "lucide-react";
import RelatedProducts from "@/src/components/RelatedProducts";
import PriceDisplay from "@/src/components/PriceDisplay";
import AddToCartButton from "@/src/components/AddToCartButton";

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
    "categoryId": category->_id
  }`;
  return await client.fetch(query, { slug });
}

const portableTextComponents = {
  block: {
    normal: ({ children }: any) => (
      <p className="mb-6 last:mb-0 leading-[1.8] text-neutral-900 font-light italic">
        {children}
      </p>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc ml-5 mb-6 space-y-3 text-neutral-900 font-light">
        {children}
      </ul>
    ),
  },
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div className="bg-brand-white min-h-screen">
      {/* 1. Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <nav className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-neutral-500 border-b border-neutral-100 pb-6">
          <Link href="/" className="hover:text-brand-beryl transition-all">Home</Link>
          <ChevronRight size={8} className="text-neutral-300" />
          <Link href="/category/all" className="hover:text-brand-beryl transition-all">Collection</Link>
          <ChevronRight size={8} className="text-neutral-300" />
          <span className="text-brand-beryl font-bold">{product.name}</span>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-20 items-start">
          
          {/* 2. Sticky Product Gallery */}
          <div className="lg:col-span-7 self-start lg:top-32">
            <ProductGallery images={product.images} />
          </div>

          {/* 3. Product Info & Interaction */}
          <div className="lg:col-span-5 my-12 lg:mt-0">
            <div className="space-y-10">
              {/* Product Title and Currency-Aware Price */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="inline-block px-3 py-1 border border-brand-beryl/20 text-[10px] uppercase tracking-widest text-brand-beryl font-bold">
                    {product.productType === 'rtw' ? 'Ready to Wear' : 'Bespoke Studio'}
                  </span>
                  {product.allowCustomization && (
                    <span className="text-[9px] uppercase tracking-widest text-neutral-400 italic">
                      Custom fit available
                    </span>
                  )}
                </div>
                
                <h1 className="font-display text-5xl md:text-6xl text-neutral-900 leading-[1.1] lowercase tracking-tighter mb-6">
                  {product.name}
                </h1>
                
                {product.productType === 'rtw' && (
                  <PriceDisplay priceNGN={product.priceNGN} />
                )}
              </div>

              {/* Robust Add to Cart System (Size, Qty, Notes) */}
              <div className="pt-4">
                <AddToCartButton product={product} />
              </div>

              {/* Product Description (Rich Text from Sanity) */}
              <div className="pt-10 border-t border-neutral-100">
                <h3 className="text-[11px] uppercase tracking-[0.3em] font-bold text-neutral-900 mb-6">
                  The Design Note
                </h3>
                <div className="text-sm prose prose-neutral max-w-none">
                  {Array.isArray(product.description) ? (
                    <PortableText value={product.description} components={portableTextComponents} />
                  ) : (
                    <p className="leading-[1.8] text-neutral-900 font-light">{product.description}</p>
                  )}
                </div>
              </div>

              {/* Size & Fit Guide Link */}
              <div className="flex items-center gap-3 p-5 bg-neutral-50 rounded-2xl">
                <Ruler size={18} strokeWidth={1.2} className="text-brand-beryl" />
                <div className="flex-1">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900">Size & Fit</h4>
                  <p className="text-[10px] text-neutral-500">Standard African sizing. Model is 5'9 wearing M.</p>
                </div>
                <button className="text-[9px] uppercase tracking-widest font-bold text-brand-beryl border-b border-brand-beryl/20">Guide</button>
              </div>

              {/* Global Logistics Trust Badges */}
              <div className="pt-10 grid grid-cols-2 gap-8 border-t border-neutral-100">
                <div className="flex gap-3">
                  <ShieldCheck size={20} strokeWidth={1.2} className="text-brand-beryl" />
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900 mb-1">Dahriola Quality</h4>
                    <p className="text-[10px] text-neutral-500 leading-tight">Authentic artisanal craftsmanship.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Truck size={20} strokeWidth={1.2} className="text-brand-beryl" />
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900 mb-1">Global Shipping</h4>
                    <p className="text-[10px] text-neutral-500 leading-tight">Express delivery from Lagos studio.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Related Products Section */}
        <div className="mt-32 pt-20 border-t border-neutral-100">
           <RelatedProducts 
            categoryId={product.categoryId} 
            currentProductId={product._id} 
            categoryName={product.categoryName}
          />
        </div>
      </main>
    </div>
  );
}