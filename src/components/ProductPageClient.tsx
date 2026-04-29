"use client";

import { useState } from "react";
import { PortableText } from "@portabletext/react";
import { ChevronDown } from "lucide-react";
import AddToCartButton from "@/src/components/AddToCartButton";
import SizeGuideModal from "@/src/components/SizeGuideModal";
import { client } from "@/src/lib/sanity";
import imageUrlBuilder from "@sanity/image-url";

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const accordionTextClass =
  "text-[13px] md:text-[14px] leading-6 text-neutral-600";

const portableTextComponents = {
  block: {
    normal: ({ children }: any) => (
      <p className={`${accordionTextClass} mb-3`}>{children}</p>
    ),

    h1: ({ children }: any) => (
      <h1 className="text-[20px] md:text-[24px] font-semibold text-black mb-3">
        {children}
      </h1>
    ),

    h2: ({ children }: any) => (
      <h2 className="text-[18px] md:text-[20px] font-semibold text-black mb-3">
        {children}
      </h2>
    ),

    h3: ({ children }: any) => (
      <h3 className="text-[16px] md:text-[18px] font-semibold text-black mb-2">
        {children}
      </h3>
    ),

    h4: ({ children }: any) => (
      <h4 className="text-[15px] font-medium text-black mb-2">
        {children}
      </h4>
    ),

    h5: ({ children }: any) => (
      <h5 className="text-[14px] font-medium text-black mb-1">
        {children}
      </h5>
    ),

    h6: ({ children }: any) => (
      <h6 className="text-[13px] font-medium text-black mb-1">
        {children}
      </h6>
    ),
  },

  marks: {
    strong: ({ children }: any) => (
      <strong className="font-semibold text-black">{children}</strong>
    ),
  },

  list: {
    bullet: ({ children }: any) => (
      <ul className={`${accordionTextClass} list-disc pl-5 space-y-1 mb-3`}>
        {children}
      </ul>
    ),
  },

  listItem: {
    bullet: ({ children }: any) => (
      <li className="leading-6">{children}</li>
    ),
  },
};

export default function ProductPageClient({ product }: { product: any }) {
  const [selectedSize, setSelectedSize] = useState("XS");

  return (
    <>
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-black">
            Size
          </h2>
          <SizeGuideModal />
        </div>

        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const isActive = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`min-w-[48px] h-[40px] px-3 rounded-md border text-[13px] font-medium transition ${
                  isActive
                    ? "bg-brand-beryl text-white border-brand-beryl"
                    : "bg-[#f7f7f7] text-black border-[#eeeeee] hover:border-black"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-black">
          Available Prints
        </h2>

        <div className="mt-4 flex flex-wrap gap-3">
          {product.prints && product.prints.length > 0 ? (
            product.prints.map((print: any, idx: number) => (
              <button
                key={print._id || idx}
                type="button"
                className="w-[64px] h-[80px] rounded-md border border-[#e9e9e9] overflow-hidden bg-[#f7f7f7] hover:border-black transition"
                title={print.name}
              >
                {print.image ? (
                  <img
                    src={urlFor(print.image).width(200).height(240).url()}
                    alt={print.name || `Print ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 px-1 text-center">
                    {print.name}
                  </div>
                )}
              </button>
            ))
          ) : (
            product.images?.slice(0, 4).map((img: any, idx: number) => (
              <button
                key={idx}
                type="button"
                className="w-[64px] h-[80px] rounded-md border border-[#e9e9e9] overflow-hidden bg-[#f7f7f7] hover:border-black transition"
              >
                <img
                  src={urlFor(img).width(200).height(240).url()}
                  alt={`${product.name} print ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <AddToCartButton product={product} selectedSize={selectedSize} />
      </section>

      <section className="mt-10 space-y-3">
        <BoxAccordion title="Description">
          <div className="pt-1">
            {Array.isArray(product.description) ? (
              <PortableText
                value={product.description}
                components={portableTextComponents}
              />
            ) : (
              <p className="text-[#444] text-[14px] leading-6">
                {product.description}
              </p>
            )}
          </div>
        </BoxAccordion>

        <BoxAccordion title="Composition & Care">
          <div className="text-[14px] leading-6 text-[#444] space-y-1">
            <p>100% cotton </p>
            <p>Hand wash separately in cold water, or machine wash on a gentle cycle</p>
            <p>
              Use mild detergent only
              Do not bleach
            </p>
            <p>Dry away from direct harsh sunlight</p>
            <p>Steam or iron on low heat (preferably inside out)</p>
          </div>
        </BoxAccordion>

        <BoxAccordion title="Size & Fit">
          <div className="text-[14px] leading-6 text-[#444] space-y-1">
            <p>Fits true to size</p>
            <p>Relaxed silhouette</p>
          </div>
        </BoxAccordion>

        {/* <BoxAccordion title="Delivery & Returns">
          <div className="text-[14px] leading-6 text-[#444] space-y-1">
            <p>Delivery within 3–5 business days.</p>
            <p>Returns accepted according to store return policy.</p>
          </div>
        </BoxAccordion> */}
      </section>
    </>
  );
}

function BoxAccordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-md bg-[#f5f5f5] px-4">
      <summary className="list-none cursor-pointer flex items-center justify-between py-5">
        <span className="text-[16px] font-medium text-black">{title}</span>
        <ChevronDown
          size={18}
          className="text-black transition-transform duration-300 group-open:rotate-180"
        />
      </summary>

      <div className="pb-5 animate-in fade-in slide-in-from-top-1 duration-200">
        {children}
      </div>
    </details>
  );
}