import { client } from "@/src/lib/sanity";
import ShopUtils from "@/src/components/ShopUtils";
import CategoryDropdown from "@/src/components/CategoryDropdown";
import ProductSearch from "@/src/components/ProductSearch";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

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

  const formatTitle = (text: string) => {
    const spaced = text.replace(/-/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <header className="bg-neutral-50 border-b border-neutral-100 pt-24 md:pt-32 pb-10 md:pb-16 mb-12">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
              <h1 className="font-display text-5xl md:text-8xl text-neutral-950 tracking-tighter leading-none">
                {formatTitle(slug)}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">
                  {products.length} Products in Collection
                </p>
                <div className="md:hidden">
                  <CategoryDropdown categories={categories} currentSlug={slug} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8">
              {/* Note: The Search button is now inside ProductSearch, which is rendered below */}
              <ShopUtils />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-12 pb-20">
        <div className="flex flex-col md:flex-row gap-16 relative">
          
          {/* DESKTOP SIDEBAR */}
          <aside className="hidden md:block w-64 shrink-0 space-y-12">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.3em] font-black text-neutral-950 mb-8 pb-4 border-b border-neutral-100">
                Categories
              </h3>
              <nav className="flex flex-col gap-6">
                <Link href="/category/all" className={`text-[11px] uppercase tracking-widest flex items-center justify-between group ${slug === 'all' ? 'text-black font-black' : 'text-neutral-400 hover:text-black'}`}>
                  All Collection <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${slug === 'all' && 'opacity-100'}`} />
                </Link>
                {categories.map((cat: any) => (
                  <Link key={cat.slug} href={`/category/${cat.slug}`} className={`text-[11px] uppercase tracking-widest flex items-center justify-between group ${slug === cat.slug ? 'text-black font-black' : 'text-neutral-400 hover:text-black'}`}>
                    {cat.title} <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${slug === cat.slug && 'opacity-100'}`} />
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* This component now controls both the Search Bar and the Product Grid */}
          <ProductSearch products={products} />
        </div>
      </div>
    </div>
  );
}