"use client";

import { useEffect, useState } from "react";
import { getWishlist } from "@/src/lib/wishlist";

export default function WishlistCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const syncWishlist = () => {
      setCount(getWishlist().length);
    };

    syncWishlist();

    window.addEventListener("wishlistUpdated", syncWishlist);
    window.addEventListener("storage", syncWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", syncWishlist);
      window.removeEventListener("storage", syncWishlist);
    };
  }, []);

  return (
    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-[11px] rounded-full bg-black text-white">
      {count}
    </span>
  );
}