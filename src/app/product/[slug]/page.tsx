import { client } from "@/src/lib/sanity";
import { notFound } from "next/navigation";
import ProductGallery from "@/src/components/ProductGallery";
import RelatedProducts from "@/src/components/RelatedProducts";
import PriceDisplay from "@/src/components/PriceDisplay";
import WishlistButton from "@/src/components/WishlistButton";
import ProductPageClient from "@/src/components/ProductPageClient";
import { Metadata } from "next";
import imageUrlBuilder from "@sanity/image-url";
import Link from "next/link";
import ProductReviews from "@/src/components/ProductReviews";

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

async function getProduct(slug: string) {
  const query = `*[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    briefDescription,
    description,
    priceNGN,
    compareAtPrice,
    productType,
    images,
    "categoryName": category->title,
    "categoryId": category->_id,
    "slug": slug.current,
    "prints": prints[]->{
      _id,
      name,
      image,
      stockQuantity,
      lowStockThreshold,
      isActive
    },
    "reviews": *[
      _type == "review" &&
      product._ref == ^._id &&
      approved == true
    ] | order(_createdAt desc) {
      _id,
      name,
      rating,
      title,
      comment
    }
  }`;

  return await client.fetch(query, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const ogImage = product.images?.[0]
    ? urlFor(product.images[0]).width(1200).height(630).url()
    : "";

  return {
    title: `${product.name} | Dahriola`,
    openGraph: {
      images: ogImage ? [{ url: ogImage }] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div className="bg-white min-h-screen">
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-24 pb-14">
        {/* BACK LINK */}
        <div className="mb-6">
          <Link
            href="/category/all"
            className="text-sm font-medium hover:text-brand-beryl"
          >
            ← Back to Shop
          </Link>
        </div>

        {/* MAIN GRID */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          {/* LEFT: IMAGES */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-24">
              <ProductGallery images={product.images} />
            </div>
          </div>

          {/* RIGHT: INFO */}
          <div className="lg:col-span-5 mt-6 lg:mt-0">
            <div className="w-full max-w-[560px]">
              {/* TITLE + WISHLIST */}
              <section>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-display text-[28px] leading-tight text-black">
                      {product.name}
                      {product.briefDescription && (
                        <span className="ml-2 font-sans text-[14px] leading-6 text-neutral-500">
                          ({product.briefDescription})
                        </span>
                      )}
                    </h1>
                  </div>

                  <WishlistButton productId={product._id} />
                </div>

                <div className="mt-3 flex items-center gap-3">
                  {product.compareAtPrice && (
                    <span className="line-through text-neutral-400">
                      <PriceDisplay priceNGN={product.compareAtPrice} />
                    </span>
                  )}

                  <span className="text-xl font-semibold">
                    <PriceDisplay priceNGN={product.priceNGN} />
                  </span>
                </div>
              </section>

              {/* CLIENT INTERACTIVE SECTION */}
              <ProductPageClient product={product} />
            </div>
          </div>
        </div>

        {/* RELATED */}
        <section className="mt-16">
          <RelatedProducts
            categoryId={product.categoryId}
            currentProductId={product._id}
            categoryName={product.categoryName}
          />
        </section>

        {/* REVIEWS */}
        <ProductReviews
          productId={product._id}
          productName={product.name}
          savedReviews={product.reviews || []}
        />
      </main>
    </div>
  );
}