import { client } from "@/src/lib/sanity";
import ProductCard from "@/src/components/ProductCard";
import ShopUtils from "@/src/components/ShopUtils"; // Import the dynamic bits
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Grid, List } from "lucide-react";

async function getData(slug: string) {
  let productFilter = '';
  if (slug === 'all') {
    productFilter = '_type == "product"';
  } else if (slug === 'Ready to Wear' || slug === 'Bespoke') {
    productFilter = `_type == "product" && productType == "${slug}"`;
  } else {
    productFilter = `_type == "product" && category->slug.current == "${slug}"`;
  }

  const query = `{
    "products": *[${productFilter}] | order(_createdAt desc) {
      _id,
      name,
      "slug": slug.current,
      productType,
      priceNGN,
      images,
      "categoryName": category->title
    },
    "categories": *[_type == "category"] {
      title,
      "slug": slug.current
    }
  }`;

  return await client.fetch(query, { slug });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, categories } = await getData(slug);

  if (!products) notFound();

  return (
    <div className="bg-[#fcfcfc] min-h-screen pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between p-2 pb-14 mb-2 gap-6">
          <div className="space-y-2">
            <h1 className="font-display text-5xl md:text-7xl text-neutral-950 lowercase tracking-tighter leading-none">
              {slug.replace(/-/g, ' ')}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">
              {products.length} Designs in Collection
            </p>
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-3 border-r border-neutral-200 pr-6">
              <Grid size={16} className="text-black cursor-pointer" />
              <List size={16} className="text-neutral-300 cursor-pointer" />
            </div>
            
            {/* The Dynamic Filter & Sort Buttons */}
            <ShopUtils />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-16">
          
          {/* SIDEBAR NAVIGATION (Desktop) */}
          <aside className="w-full md:w-64 shrink-0 space-y-12">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-neutral-950 mb-8 pb-4 border-b border-neutral-100">
                Categories
              </h3>
              <nav className="flex flex-col gap-6">
                <Link 
                  href="/category/all" 
                  className={`text-[11px] uppercase tracking-widest flex items-center justify-between group ${slug === 'all' ? 'text-black font-black' : 'text-neutral-400 hover:text-black'}`}
                >
                  All Collection <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${slug === 'all' && 'opacity-100'}`} />
                </Link>
                {categories.map((cat: any) => (
                  <Link 
                    key={cat.slug} 
                    href={`/category/${cat.slug}`} 
                    className={`text-[11px] uppercase tracking-widest flex items-center justify-between group ${slug === cat.slug ? 'text-black font-black' : 'text-neutral-400 hover:text-black'}`}
                  >
                    {cat.title}
                    <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${slug === cat.slug && 'opacity-100'}`} />
                  </Link>
                ))}
              </nav>
            </div>

            {/* SECONDARY FILTER BLOCK */}
            <div className="hidden md:block">
              <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-neutral-950 mb-8 pb-4 border-b border-neutral-100">
                Availability
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-neutral-500 cursor-pointer hover:text-black">
                  <input type="checkbox" className="w-3 h-3 border-neutral-300 rounded-none accent-black" />
                  Ready to Ship
                </label>
                <label className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-neutral-500 cursor-pointer hover:text-black">
                  <input type="checkbox" className="w-3 h-3 border-neutral-300 rounded-none accent-black" />
                  Made to Order
                </label>
              </div>
            </div>
          </aside>

          {/* PRODUCT GRID */}
          <main className="flex-1">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
                {products.map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="h-[40vh] flex items-center justify-center border-t border-neutral-100">
                <p className="font-display text-2xl text-neutral-300 lowercase tracking-tighter">no designs found.</p>
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}