"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { isInWishlist, toggleWishlist } from "@/src/lib/wishlist";

type WishlistButtonProps = {
  productId: string;
  productName?: string;
};

export default function WishlistButton({
  productId,
  productName,
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWishlisted(isInWishlist(productId));
    setMounted(true);
  }, [productId]);

  function handleToggle() {
    const result = toggleWishlist(productId);
    setWishlisted(result.isWishlisted);
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Add to wishlist"
        className="shrink-0 w-9 h-9 border border-[#ebebeb] rounded-md flex items-center justify-center"
      >
        <Heart size={17} strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center transition ${
        wishlisted
          ? "border border-black bg-black text-white"
          : "border border-[#ebebeb] bg-white text-black hover:border-black"
      }`}
    >
      <Heart
        size={17}
        strokeWidth={1.75}
        className={wishlisted ? "fill-current" : ""}
      />
    </button>
  );
}