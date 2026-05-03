"use client";

import { useState } from "react";
import { PortableText } from "@portabletext/react";
import { ChevronDown, X, Check } from "lucide-react";
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
    bullet: ({ children }: any) => <li className="leading-6">{children}</li>,
  },
};

export default function ProductPageClient({ product }: { product: any }) {
  const [selectedSize, setSelectedSize] = useState("XS");
  const [selectedPrint, setSelectedPrint] = useState<any | null>(null);
  const [previewPrint, setPreviewPrint] = useState<any | null>(null);
  const [showAllPrints, setShowAllPrints] = useState(false);

  const printOptions =
    product.prints && product.prints.length > 0
      ? product.prints
          .filter((print: any) => print.isActive !== false)
          .map((print: any, idx: number) => {
            const stockQuantity = Number(print.stockQuantity || 0);
            const lowStockThreshold = Number(print.lowStockThreshold || 2);

            return {
              id: print._id || `print-${idx}`,
              _id: print._id,
              name: print.name || `Print ${idx + 1}`,
              image: print.image,
              stockQuantity,
              lowStockThreshold,
              isOutOfStock: stockQuantity <= 0,
              isLowStock:
                stockQuantity > 0 && stockQuantity <= lowStockThreshold,
            };
          })
      : [];

  const visiblePrints = showAllPrints
    ? printOptions
    : printOptions.slice(0, 6);

  const activePrint =
    selectedPrint && !selectedPrint.isOutOfStock
      ? selectedPrint
      : printOptions.find((print: any) => !print.isOutOfStock) || null;

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
                className={`min-w-[48px] h-[40px] px-3 rounded-md border text-[13px] font-medium transition cursor-pointer ${
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

      {printOptions.length > 0 && (
        <section className="mt-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-black">
                Available Prints
              </h2>

              {activePrint && (
                <p className="text-[11px] text-brand-beryl font-semibold mt-1">
                  Selected: {activePrint.name}
                </p>
              )}
            </div>

            {printOptions.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllPrints((prev) => !prev)}
                className="text-[9px] uppercase tracking-widest font-bold text-brand-beryl border-b border-brand-beryl/20 hover:text-black transition-colors"
              >
                {showAllPrints ? "View Less" : "View More"}
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {visiblePrints.map((print: any) => {
              const isSelected = activePrint?.id === print.id;

              return (
                <button
                  key={print.id}
                  type="button"
                  disabled={print.isOutOfStock}
                  onClick={() => {
                    if (print.isOutOfStock) return;
                    setSelectedPrint(print);
                    setPreviewPrint(print);
                  }}
                  className={`relative w-[64px] h-[80px] rounded-md overflow-hidden bg-[#f7f7f7] transition ${
                    print.isOutOfStock
                      ? "cursor-not-allowed opacity-40 grayscale"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? "border-2 border-brand-beryl ring-2 ring-brand-beryl/20"
                      : "border border-[#e9e9e9] hover:border-black"
                  }`}
                  title={print.name}
                >
                  {print.image ? (
                    <img
                      src={urlFor(print.image).width(500).height(650).url()}
                      alt={print.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 px-1 text-center">
                      {print.name}
                    </div>
                  )}

                  {isSelected && !print.isOutOfStock && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-beryl text-white flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}

                  {print.isOutOfStock && (
                    <span className="absolute inset-x-1 bottom-1 bg-black/80 text-white text-[7px] uppercase tracking-widest py-1 rounded">
                      Out
                    </span>
                  )}

                  {print.isLowStock && !print.isOutOfStock && (
                    <span className="absolute inset-x-1 bottom-1 bg-brand-beryl/90 text-white text-[7px] uppercase tracking-widest py-1 rounded">
                      Low
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <AddToCartButton
          product={product}
          selectedSize={selectedSize}
          selectedPrint={activePrint}
        />
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
            <p>100% cotton</p>
            <p>
              Hand wash separately in cold water, or machine wash on a gentle
              cycle
            </p>
            <p>Use mild detergent only. Do not bleach.</p>
            <p>Dry away from direct harsh sunlight</p>
            <p>Steam or iron on low heat, preferably inside out</p>
          </div>
        </BoxAccordion>

        <BoxAccordion title="Size & Fit">
          <div className="text-[14px] leading-6 text-[#444] space-y-1">
            <p>Fits true to size</p>
            <p>Relaxed silhouette</p>
          </div>
        </BoxAccordion>

        <BoxAccordion title="Production Time">
          <div className="text-[14px] leading-6 text-[#444] space-y-1">
            <p>
              This outfit requires 2–4 working days for production before
              dispatch.
            </p>
          </div>
        </BoxAccordion>
      </section>

      {previewPrint && (
        <div
          className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPrint(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPrint(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow"
            >
              <X size={20} />
            </button>

            <div className="p-4 border-b border-neutral-100">
              <p className="text-sm font-semibold text-black">
                {previewPrint.name}
              </p>

              {previewPrint.stockQuantity > 0 && (
                <p className="text-[11px] text-neutral-500 mt-1">
                  {previewPrint.stockQuantity} outfit
                  {previewPrint.stockQuantity === 1 ? "" : "s"} available from
                  this print
                </p>
              )}
            </div>

            <div className="max-h-[78vh] overflow-auto bg-neutral-50">
              {previewPrint.image ? (
                <img
                  src={urlFor(previewPrint.image).width(1200).url()}
                  alt={previewPrint.name}
                  className="w-full h-auto object-contain"
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-neutral-400">
                  No print image available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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