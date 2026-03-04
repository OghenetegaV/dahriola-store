import { client } from "@/src/lib/sanity";
import ProductCard from "./ProductCard";
import Link from "next/link";

interface RelatedProps {
  categoryId: string;
  currentProductId: string;
  categoryName: string;
}

async function getRelatedProducts(categoryId: string, currentProductId: string) {
  // If categoryId is missing, return empty array immediately
  if (!categoryId) return [];

  const query = `*[_type == "product" && category._ref == $categoryId && _id != $currentProductId] | order(_createdAt desc) [0...3] {
    _id,
    name,
    "slug": slug.current,
    productType,
    priceNGN,
    images,
    "categoryName": category->title
  }`;
  
  return await client.fetch(query, { categoryId, currentProductId });
}

export default async function RelatedProducts({ categoryId, currentProductId, categoryName }: RelatedProps) {
  // Safety check before fetching
  if (!categoryId) return null;

  const products = await getRelatedProducts(categoryId, currentProductId);

  if (!products || products.length === 0) return null;

  return (
    <section className="mt-32 pt-24 border-t border-neutral-100">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h3 className="font-display text-4xl text-neutral-900">Related Pieces</h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mt-2 italic">
            More from the {categoryName} collection
          </p>
        </div>
        <Link href="/shop" className="text-[10px] uppercase tracking-widest border-b border-neutral-200 pb-1 hover:text-brand-beryl transition-colors cursor-pointer">
          Browse All
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
        {products.map((item: any) => (
          <ProductCard key={item._id} product={item} />
        ))}
      </div>
    </section>
  );
}