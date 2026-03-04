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
  const displayTitle = slug === 'rtw' ? 'Ready to Wear' : 
                       slug === 'bespoke' ? 'Bespoke Studio' :
                       slug === 'all' ? 'The Collection' : 
                       slug.replace(/-/g, ' ');

  const isRtwActive = slug === 'rtw' || categories.some((c: any) => c.slug === slug);

  const whatsappNumber = "2347065364401";

  return (
    <div className="bg-brand-white min-h-screen pt-12 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <header className="mb-12 relative overflow-visible z-50">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-sage via-brand-beryl to-brand-sage opacity-100 scale-110 blur-3xl" />
          
          <div className="border border-white/20 rounded-sm bg-white/60 backdrop-blur-xl pb-12 pt-12 px-6 md:px-10 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="font-display text-5xl md:text-8xl text-neutral-950 mb-6 lowercase tracking-tighter">
                  {displayTitle}<span className="text-brand-beryl">.</span>
                </h1>
                <div className="flex items-center gap-3">
                  <span className="h-[2px] w-8 md:w-12 bg-neutral-950" />
                  <p className="text-[10px] md:text-[12px] uppercase tracking-[0.4em] text-neutral-950 font-bold">
                    {isBespoke ? 'Gallery' : 'Archive'} // {products.length} {products.length === 1 ? 'Design' : 'Selected Works'}
                  </p>
                </div>
              </div>

              <nav className="flex items-center gap-6 md:gap-8 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold">
                <Link href="/category/all" className={`cursor-pointer transition-colors ${slug === 'all' ? 'text-neutral-950 border-b-2 border-brand-beryl' : 'text-neutral-700 hover:text-neutral-950'}`}>
                  All
                </Link>

                <div className="relative group cursor-pointer focus-within:outline-none">
                  <button className={`flex items-center gap-1 transition-colors uppercase tracking-[0.2em] font-bold ${isRtwActive ? 'text-neutral-950' : 'text-neutral-700'}`}>
                    RTW <ChevronDown size={10} className="group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                  <div className="absolute left-0 md:left-auto md:right-0 pt-4 invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 z-[9999]">
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl py-6 min-w-[220px] rounded-sm">
                      <Link href="/category/rtw" className="block px-8 py-3 text-[9px] text-neutral-500 hover:text-brand-beryl transition-colors tracking-[0.3em] uppercase">View All RTW</Link>
                      <div className="h-[1px] bg-neutral-950/5 my-3 mx-8" />
                      {categories.filter((cat: any) => cat.slug !== 'bespoke').map((cat: any) => (
                        <Link key={cat.slug} href={`/category/${cat.slug}`} className={`block px-8 py-3 text-[10px] tracking-[0.2em] transition-all hover:text-brand-beryl hover:pl-10 ${slug === cat.slug ? 'text-brand-beryl font-black' : 'text-neutral-600'}`}>
                          {cat.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <Link href="/category/bespoke" className={`cursor-pointer transition-colors ${slug === 'bespoke' ? 'text-neutral-950 border-b-2 border-brand-beryl' : 'text-neutral-700 hover:text-neutral-950'}`}>
                  Bespoke
                </Link>
              </nav>
            </div>

            {isBespoke && (
              <div className="mt-12 pt-8 border-t border-neutral-950/5 flex flex-wrap gap-6 md:gap-12">
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=Hello, I would like to book a bespoke consultation appointment.`}
                  target="_blank"
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-neutral-950 hover:text-brand-beryl transition-colors"
                >
                  <Calendar size={14} /> Book Appointment
                </a>
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=Hello, I have a custom design idea I'd like to discuss with the tailor.`}
                  target="_blank"
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-neutral-950 hover:text-brand-beryl transition-colors"
                >
                  <MessageCircle size={14} /> Talk to Tailor
                </a>
              </div>
            )}
          </div>
        </header>

        {products.length > 0 ? (
          <div className={`grid ${isBespoke ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24'}`}>
            {products.map((product: any) => {
              const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hello, I am interested in this bespoke design from your gallery: ${product.name}.`;
              
              if (isBespoke) {
                return (
                  <div key={product._id} className="relative group overflow-hidden bg-neutral-100 rounded-sm">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <ProductCard product={product} galleryOnly={true} />
                      <div className="absolute inset-0 bg-neutral-950/0 group-hover:bg-neutral-950/20 transition-all duration-500 flex items-center justify-center pointer-events-none">
                        <span className="opacity-0 group-hover:opacity-100 bg-white text-neutral-950 text-[10px] uppercase tracking-widest px-6 py-3 font-bold transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl">
                          Inquire on WhatsApp
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
          <div className="py-28 text-center border border-neutral-200 bg-neutral-50/50">
            <p className="font-display text-2xl md:text-3xl text-neutral-400 italic font-light">The studio is currently in session.</p>
          </div>
        )}
      </div>
    </div>
  );
}