"use server";

import { db, unwrap } from "@/src/lib/supabase/admin";
import { sendStoreAlert } from "@/src/app/actions/email";

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
    const product = unwrap(await db().from("products").select("name").eq("id", productId).maybeSingle(), "Checking the product") as { name: string } | null;
    if (!product) return { success: false, message: "Unable to submit review right now." };

    const rating = Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5)));
    unwrap(
      await db().from("reviews").insert({
        product_id: productId,
        name,
        rating,
        title: clean(data.title, 120) || "Customer Review",
        comment,
        approved: false,
      }),
      "Saving the review"
    );

    // Tell the store there's a review to approve (it stays hidden until then)
    await sendStoreAlert({
      subject: `New review to approve: ${product.name}`,
      heading: "A new review is waiting for your approval",
      rows: [
        ["Product", product.name],
        ["From", name],
        ["Rating", `${rating} out of 5`],
      ],
      quote: comment,
      linkPath: "/admin/reviews",
      linkLabel: "Review and approve",
      tag: "store-new-review",
    });

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
