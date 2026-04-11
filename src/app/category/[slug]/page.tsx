import { client } from "@/src/lib/sanity";
import ProductCard from "@/src/components/ProductCard";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, MessageCircle, Calendar } from "lucide-react";

async function getData(slug: string) {
  let productFilter = '';
  if (slug === 'all') {
    productFilter = '_type == "product"';
  } else if (slug === 'rtw' || slug === 'bespoke') {
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

  const isBespoke = slug === 'bespoke';
  const displayTitle = slug === 'rtw' ? 'ready to wear' : 
                       slug === 'bespoke' ? 'bespoke studio' :
                       slug === 'all' ? 'the collection' : 
                       slug.replace(/-/g, ' ');

  const isRtwActive = slug === 'rtw' || categories.some((c: any) => c.slug === slug);
  const whatsappNumber = "2347065364401";

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* EDITORIAL HEADER */}
        <header className="pt-32 pb-12 border-b border-neutral-100 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-4">
               <p className="text-[10px] uppercase tracking-[0.5em] text-neutral-400 font-bold">
                {isBespoke ? 'Exclusive Craft' : 'Curated Volume'} // {products.length} Designs
              </p>
              <h1 className="font-display text-5xl md:text-8xl text-neutral-900 lowercase tracking-tighter leading-none">
                {displayTitle}
              </h1>
            </div>

            {/* MINIMAL NAV */}
            <nav className="flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-bold">
              <Link href="/category/all" className={`transition-all ${slug === 'all' ? 'text-black border-b border-black pb-1' : 'text-neutral-300 hover:text-black'}`}>
                All
              </Link>

              <div className="relative group">
                <button className={`flex items-center gap-1 uppercase tracking-[0.2em] font-bold transition-all ${isRtwActive ? 'text-black' : 'text-neutral-300'}`}>
                  RTW <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
                </button>
                
                {/* REFINED DROPDOWN */}
                <div className="absolute right-0 md:left-0 pt-6 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                  <div className="bg-white border border-neutral-100 shadow-2xl py-4 min-w-[200px] rounded-xl overflow-hidden">
                    <Link href="/category/rtw" className="block px-6 py-3 text-[10px] text-neutral-400 hover:text-black hover:bg-neutral-50 transition-all tracking-[0.2em]">View All</Link>
                    <div className="h-[1px] bg-neutral-100 my-2" />
                    {categories.filter((cat: any) => cat.slug !== 'bespoke').map((cat: any) => (
                      <Link key={cat.slug} href={`/category/${cat.slug}`} className={`block px-6 py-3 text-[10px] tracking-[0.2em] transition-all hover:bg-neutral-50 ${slug === cat.slug ? 'text-black font-black bg-neutral-50' : 'text-neutral-500 hover:text-black'}`}>
                        {cat.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/category/bespoke" className={`transition-all ${slug === 'bespoke' ? 'text-black border-b border-black pb-1' : 'text-neutral-300 hover:text-black'}`}>
                Bespoke
              </Link>
            </nav>
          </div>

          {/* BESPOKE ACTIONS */}
          {isBespoke && (
            <div className="mt-10 flex flex-wrap gap-8">
              <a href={`https://wa.me/${whatsappNumber}?text=Consultation`} target="_blank" className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-neutral-900 hover:opacity-60 transition-opacity">
                <Calendar size={14} /> Book Consultation
              </a>
              <a href={`https://wa.me/${whatsappNumber}?text=CustomDesign`} target="_blank" className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-neutral-900 hover:opacity-60 transition-opacity">
                <MessageCircle size={14} /> Design Discussion
              </a>
            </div>
          )}
        </header>

        {/* PRODUCT GRID */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((product: any) => {
              const whatsappLink = `https://wa.me/${whatsappNumber}?text=Enquiry: ${product.name}`;
              
              if (isBespoke) {
                return (
                  <div key={product._id} className="relative group rounded-3xl overflow-hidden">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <ProductCard product={product} galleryOnly={true} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-white text-black text-[10px] uppercase tracking-widest px-6 py-3 font-bold rounded-full shadow-2xl transition-all transform translate-y-4 group-hover:translate-y-0">
                          Inquire
                        </span>
                      </div>
                    </a>
                  </div>
                );
              }

              return <ProductCard key={product._id} product={product} />;
            })}
          </div>
        ) : (
          <div className="py-40 text-center">
            <p className="font-display text-3xl text-neutral-300 lowercase tracking-tighter">The atelier is currently in session.</p>
          </div>
        )}
      </div>
    </div>
  );
}