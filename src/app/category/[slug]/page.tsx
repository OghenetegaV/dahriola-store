import { client } from "@/src/lib/sanity";
import CategoryDropdown from "@/src/components/CategoryDropdown";
import ProductSearch from "@/src/components/ProductSearch";
import CategorySlider from "@/src/components/CategorySlider";
import { notFound } from "next/navigation";
import Link from "next/link";

async function getData(slug: string) {
  let productFilter = "";

  if (slug === "all") {
    productFilter = '_type == "product"';
  } else if (slug === "rtw") {
    productFilter = '_type == "product" && productType == "rtw"';
  } else if (slug === "bespoke") {
    productFilter = '_type == "product" && productType == "bespoke"';
  } else {
    productFilter = `_type == "product" && category->slug.current == "${slug}"`;
  }

  const query = `{
    "products": *[${productFilter}] | order(_createdAt desc) {
      _id,
      name,
      _createdAt,
      "slug": slug.current,
      productType,
      priceNGN,
      images,
      "categoryName": category->title
    },
    "categories": *[_type == "category"] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      image
    },
    "heroProduct": *[${productFilter} && defined(images[0])][0] {
      images
    }
  }`;

  return await client.fetch(query);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { products, categories, heroProduct } = await getData(slug);

  if (!products) notFound();

  const formatTitle = (text: string) => {
    if (text === "all") return "All";
    if (text === "rtw") return "Ready to Wear";
    return text
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const heroTitle = formatTitle(slug);
  const heroImage =
    heroProduct?.images?.[0] || products?.find((p: any) => p.images?.[0])?.images?.[0];

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      {/* HERO */}
      <section className="pt-24 md:pt-32">
        <div className="max-w-[1600px] mx-auto px-3 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-stretch">
            <div className="relative h-[180px] sm:h-[280px] md:h-[420px] rounded-md overflow-hidden bg-neutral-200">
              {heroImage ? (
                <img
                  src={heroImage.asset ? "" : ""}
                  alt={heroTitle}
                  className="hidden"
                />
              ) : null}

              <SanityHeroImage image={heroImage} title={heroTitle} />

              <div className="absolute inset-0 bg-black/10" />

              <h1 className="absolute left-6 top-8 text-white text-sm md:text-base font-medium uppercase tracking-wide">
                {heroTitle}
              </h1>
            </div>

            {/* DESKTOP CATEGORY LIST */}
            <aside className="hidden lg:flex flex-col justify-center pl-2">
              <nav className="flex flex-col gap-3 text-[24px] leading-tight text-black">
                {categories.map((cat: any) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className={`hover:text-brand-beryl transition ${
                      slug === cat.slug ? "text-brand-beryl" : ""
                    }`}
                  >
                    {cat.title}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>

          {/* MOBILE CATEGORY SLIDER */}
          {/* <div className="lg:hidden mt-3">
            <CategorySlider categories={categories} currentSlug={slug} />
          </div> */}

          {/* FILTER ROW */}
          <div className="mt-5 md:mt-6 flex items-center justify-between">
            <div className="md:hidden">
              <CategoryDropdown categories={categories} currentSlug={slug} />
            </div>

            {/* <button className="text-[12px] uppercase bg-neutral-100 px-3 py-2 rounded-sm hover:bg-neutral-200 transition">
              Filter/Sort +
            </button> */}

            <p className="text-[11px] text-neutral-700">
              {products.length} items
            </p>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="max-w-[1600px] mx-auto px-3 md:px-8 lg:px-12 pt-6 pb-20">
        <ProductSearch products={products} />
      </section>
    </div>
  );
}

function SanityHeroImage({ image, title }: { image: any; title: string }) {
  if (!image?.asset?._ref) {
    return (
      <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-400">
        {title}
      </div>
    );
  }

  const ref = image.asset._ref;
  const [, id, dimensions, format] = ref.split("-");
  const src = `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${id}-${dimensions}.${format}`;

  return (
    <img
      src={src}
      alt={title}
      className="w-full h-full object-cover object-center"
    />
  );
}