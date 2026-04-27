"use client";

import { useMemo, useState } from "react";
import { Star, Quote, Send } from "lucide-react";

type Review = {
  id: string;
  name: string;
  rating: number;
  title: string;
  comment: string;
};

const PLACEHOLDER_REVIEWS: Review[] = [
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
  // {
  //   id: "3",
  //   name: "Mariam B.",
  //   rating: 4,
  //   title: "Elegant and easy to wear",
  //   comment:
  //     "The design feels intentional and flattering. I love how effortless it looks when styled.",
  // },
];

export default function ProductReviews({
  productName,
}: {
  productName: string;
}) {
  const [reviews, setReviews] = useState<Review[]>(PLACEHOLDER_REVIEWS);
  const [formData, setFormData] = useState({
    name: "",
    rating: 5,
    title: "",
    comment: "",
  });

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.comment) return;

    setReviews([
      {
        id: Date.now().toString(),
        name: formData.name,
        rating: Number(formData.rating),
        title: formData.title || "Customer Review",
        comment: formData.comment,
      },
      ...reviews,
    ]);

    setFormData({
      name: "",
      rating: 5,
      title: "",
      comment: "",
    });
  };

  return (
    <section className="mt-20 overflow-hidden rounded-[2rem] bg-[#11140f] text-white">
      <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
        {/* LEFT PANEL */}
        <div className="relative p-7 md:p-10 lg:p-12 bg-[#778472]">
          {/* <Quote className="absolute right-8 top-8 text-white/20" size={76} /> */}

          {/* <p className="text-[11px] uppercase tracking-[0.35em] font-bold text-white/70 mb-4">
            Customer Love
          </p> */}

          {/* <h2 className="font-display text-4xl md:text-5xl leading-none">
            What they’re saying
          </h2> */}

          {/* <p className="mt-5 text-sm leading-6 text-white/80 max-w-sm">
            Real notes from customers who love the fit, finish, and presence of
            Dahriola pieces.
          </p> */}

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

        {/* RIGHT PANEL */}
        <div className="p-5 md:p-8 lg:p-10">
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.slice(0, 4).map((review) => (
              <article
                key={review.id}
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

          {/* FORM */}
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

            <button
              type="submit"
              className="mt-4 h-12 px-7 rounded-full bg-white text-black text-sm font-semibold hover:bg-brand-beryl hover:text-white transition"
            >
              Submit Review
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}