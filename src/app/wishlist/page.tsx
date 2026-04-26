"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { client } from "@/src/lib/sanity";
import imageUrlBuilder from "@sanity/image-url";
import { getWishlist, removeFromWishlist } from "@/src/lib/wishlist";

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

type WishlistProduct = {
  _id: string;
  name: string;
  slug: string;
  priceNGN: number;
  images?: any[];
};

export default function WishlistPage() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistProducts() {
      const ids = getWishlist();

      if (!ids.length) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const query = `*[_type == "product" && _id in $ids]{
        _id,
        name,
        priceNGN,
        images,
        "slug": slug.current
      }`;

      const result = await client.fetch(query, { ids });
      setProducts(result || []);
      setLoading(false);
    }

    loadWishlistProducts();

    const refresh = () => loadWishlistProducts();
    window.addEventListener("wishlistUpdated", refresh);

    return () => {
      window.removeEventListener("wishlistUpdated", refresh);
    };
  }, []);

  function handleRemove(productId: string) {
    removeFromWishlist(productId);
    setProducts((prev) => prev.filter((item) => item._id !== productId));
  }

  if (loading) {
    return <div className="px-4 pt-32 pb-16">Loading wishlist...</div>;
  }

  if (!products.length) {
    return <div className="px-4 pt-32 pb-16">Your wishlist is empty.</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-medium mb-8">Wishlist</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border rounded-xl p-3">
            <Link href={`/shop/${product.slug}`}>
              <div className="aspect-[3/4] bg-[#f5f5f5] rounded-lg overflow-hidden mb-3">
                {product.images?.[0] ? (
                  <img
                    src={urlFor(product.images[0]).width(600).height(800).url()}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
            </Link>

            <Link href={`/shop/${product.slug}`}>
              <h2 className="text-sm font-medium mb-1">{product.name}</h2>
            </Link>

            <p className="text-sm mb-3">₦{product.priceNGN?.toLocaleString()}</p>

            <button
              type="button"
              onClick={() => handleRemove(product._id)}
              className="text-sm underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}