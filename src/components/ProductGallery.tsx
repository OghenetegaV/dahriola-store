"use client";

import { useState } from "react";
import Image from "next/image";
import { urlFor } from "../lib/sanity";

export default function ProductGallery({ images }: { images: any[] }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) return <div className="aspect-[3/4] bg-neutral-100" />;

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4 pb-12">
      {/* Thumbnail Strip */}
      <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible no-scrollbar">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative flex-shrink-0 w-20 h-28 lg:w-24 lg:h-32 bg-neutral-100 overflow-hidden border transition-all ${
              selectedImage === index ? "border-brand-beryl shadow-md" : "border-transparent"
            }`}
          >
            <Image
              src={urlFor(image).url()}
              alt={`Thumbnail ${index}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Feature Image */}
      <div className="relative aspect-[3/4] w-full h-full bg-neutral-50 overflow-hidden">
        <Image
          src={urlFor(images[selectedImage]).url()}
          alt="Product feature"
          fill
          priority
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}