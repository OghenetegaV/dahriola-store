"use client";

import { useMemo, useState } from "react";
import { Star, Send } from "lucide-react";
import { submitReview } from "@/src/app/actions/reviews";

type Review = {
  id?: string;
  _id?: string;
  name: string;
  rating: number;
  title: string;
  comment: string;
};

type ProductReviewsProps = {
  productId: string;
  productName: string;
  savedReviews?: Review[];
};

const REVIEW_POOL: Review[] = [
  {
    id: "1",
    name: "Amaka O.",
    rating: 5,
    title: "The quality is beautiful",
    comment:
      "The fabric, finishing, and fit all feel premium. It gave exactly the elegant look I wanted.",
  },
  {
    id: "2",
    name: "Tolu A.",
    rating: 5,
    title: "Instant compliments",
    comment:
      "I wore it once and got compliments immediately. It feels comfortable but still very polished.",
  },
  {
    id: "3",
    name: "Mariam B.",
    rating: 4,
    title: "Elegant and easy to wear",
    comment:
      "The design feels intentional and flattering. I love how effortless it looks when styled.",
  },
  {
    id: "4",
    name: "Kemi R.",
    rating: 5,
    title: "Very flattering fit",
    comment:
      "The shape sits so nicely on the body. It made me feel dressed up without trying too hard.",
  },
  {
    id: "5",
    name: "Ify N.",
    rating: 5,
    title: "Exactly as pictured",
    comment:
      "The outfit looked just like the photos. The color, fit, and finishing were all very neat.",
  },
  {
    id: "6",
    name: "Bisola T.",
    rating: 4,
    title: "Beautiful craftsmanship",
    comment:
      "You can tell attention was paid to the details. The stitching and finishing were really clean.",
  },
  {
    id: "7",
    name: "Rukayat S.",
    rating: 5,
    title: "Worth it",
    comment:
      "The piece feels special and well-made. I loved how polished it looked when I wore it out.",
  },
  {
    id: "8",
    name: "Zainab A.",
    rating: 5,
    title: "Comfortable and stylish",
    comment:
      "It was comfortable for hours and still looked elegant. I would definitely order again.",
  },
];

function hashString(value: string) {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getStableProductReviews(productName: string, count = 4) {
  const seed = hashString(productName || "dahriola-product");

  const shuffled = [...REVIEW_POOL].sort((a, b) => {
    const aHash = hashString(`${productName}-${a.id}-${seed}`);
    const bHash = hashString(`${productName}-${b.id}-${seed}`);

    return aHash - bHash;
  });

  return shuffled.slice(0, count).map((review, index) => ({
    ...review,
    id: `${productName}-${review.id}-${index}`,
  }));
}

export default function ProductReviews({
  productId,
  productName,
  savedReviews = [],
}: ProductReviewsProps) {
  const placeholderReviews = useMemo(
    () => getStableProductReviews(productName, 4),
    [productName]
  );

  const initialReviews = savedReviews.length > 0 ? savedReviews : placeholderReviews;

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    rating: 5,
    title: "",
    comment: "",
  });

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;

    return (
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    );
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.comment) return;

    setIsSubmitting(true);
    setSubmitMessage("");

    const result = await submitReview({
      productId,
      name: formData.name,
      rating: Number(formData.rating),
      title: formData.title || "Customer Review",
      comment: formData.comment,
    });

    if (result.success) {
      setSubmitMessage("Review submitted. It will appear after approval.");

      setFormData({
        name: "",
        rating: 5,
        title: "",
        comment: "",
      });
    } else {
      setSubmitMessage(result.message || "Unable to submit review.");
    }

    setIsSubmitting(false);
  };

  return (
    <section className="mt-20 overflow-hidden rounded-[2rem] bg-[#11140f] text-white">
      <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative p-7 md:p-10 lg:p-12 bg-[#778472]">
          <div className="mt-8 rounded-2xl bg-white/10 backdrop-blur p-5 border border-white/15">
            <div className="flex items-center gap-2 text-white mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={
                    star <= Math.round(averageRating)
                      ? "fill-white"
                      : "fill-none"
                  }
                />
              ))}
            </div>

            <p className="text-3xl font-semibold">
              {averageRating.toFixed(1)}
              <span className="text-base text-white/60"> / 5</span>
            </p>

            <p className="text-xs uppercase tracking-widest text-white/60 mt-1">
              Based on {reviews.length} reviews
            </p>
          </div>
        </div>

        <div className="p-5 md:p-8 lg:p-10">
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.slice(0, 4).map((review) => (
              <article
                key={review._id || review.id}
                className="rounded-2xl bg-white text-black p-5 shadow-xl shadow-black/10 border border-white/10"
              >
                <div className="flex items-center gap-0.5 text-brand-beryl mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={
                        star <= review.rating
                          ? "fill-brand-beryl"
                          : "fill-none"
                      }
                    />
                  ))}
                </div>

                <h3 className="text-[15px] font-semibold text-black">
                  {review.title}
                </h3>

                <p className="text-sm leading-6 text-neutral-600 mt-3">
                  “{review.comment}”
                </p>

                <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-bold mt-5">
                  {review.name}
                </p>
              </article>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-2xl text-white">
                  Leave a review
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Share your thoughts on {productName}.
                </p>
              </div>

              <Send className="text-white/30 shrink-0" size={22} />
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="h-11 rounded-xl bg-white text-black px-4 text-sm outline-none"
              />

              <select
                value={formData.rating}
                onChange={(e) =>
                  setFormData({ ...formData, rating: Number(e.target.value) })
                }
                className="h-11 rounded-xl bg-white text-black px-4 text-sm outline-none"
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>

              <input
                type="text"
                placeholder="Review title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="h-11 rounded-xl bg-white text-black px-4 text-sm outline-none"
              />
            </div>

            <textarea
              placeholder="Write your review"
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              className="mt-3 w-full min-h-[110px] rounded-xl bg-white text-black p-4 text-sm outline-none resize-none"
            />

            {submitMessage && (
              <p className="mt-3 text-xs text-white/70">{submitMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 h-12 px-7 rounded-full bg-white text-black text-sm font-semibold hover:bg-brand-beryl hover:text-white transition disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}