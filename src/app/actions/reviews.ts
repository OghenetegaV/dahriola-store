"use server";

import { client } from "@/src/lib/sanity";

export async function submitReview(data: {
  productId: string;
  name: string;
  rating: number;
  title?: string;
  comment: string;
}) {
  if (!data.productId || !data.name || !data.comment) {
    return {
      success: false,
      message: "Missing required review fields.",
    };
  }

  try {
    await client.create({
      _type: "review",
      product: {
        _type: "reference",
        _ref: data.productId,
      },
      name: data.name,
      rating: Number(data.rating),
      title: data.title || "Customer Review",
      comment: data.comment,
      approved: false,
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