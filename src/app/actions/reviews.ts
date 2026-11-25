"use server";

import { COUNT, countRows, db, unwrap } from "@/src/lib/supabase/admin";

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function submitReview(data: {
  productId: string;
  name: string;
  rating: number;
  title?: string;
  comment: string;
}) {
  const productId = clean(data.productId, 100);
  const name = clean(data.name, 80);
  const comment = clean(data.comment, 2000);
  if (!productId || !name || !comment) {
    return {
      success: false,
      message: "Missing required review fields.",
    };
  }

  try {
    // Only real products can be reviewed
    const exists = await countRows(db().from("products").select("*", COUNT).eq("id", productId));
    if (!exists) return { success: false, message: "Unable to submit review right now." };

    unwrap(
      await db().from("reviews").insert({
        product_id: productId,
        name,
        rating: Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5))),
        title: clean(data.title, 120) || "Customer Review",
        comment,
        approved: false,
      }),
      "Saving the review"
    );

    return {
      success: true,
      message: "Review submitted successfully. It will appear after approval.",
    };
  } catch (error) {
    console.error("Review submission error:", error);

    return {
      success: false,
      message: "Unable to submit review right now.",
    };
  }
}
