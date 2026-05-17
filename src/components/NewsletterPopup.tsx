"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthday: "",
    source: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const closePopup = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);

        setFormData({
          name: "",
          email: "",
          birthday: "",
          source: "",
        });

        setTimeout(() => {
          setIsOpen(false);
        }, 2500);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[950px] bg-white overflow-hidden flex flex-col md:flex-row shadow-2xl"
          >
            <button
              onClick={closePopup}
              className="absolute top-6 right-6 z-20 p-2 hover:bg-neutral-50 rounded-full transition-colors text-neutral-700 hover:text-neutral-900"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            <div className="relative w-full md:w-1/2 bg-neutral-100">
              <div className="block md:hidden">
                <img
                  src="/newsletter_2.jpg"
                  alt="Dahriola Couture"
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="hidden md:block absolute inset-0">
                <Image
                  src="/newsletter_2.jpg"
                  alt="Dahriola Couture"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="absolute inset-0 bg-black/5" />
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
              <div className="space-y-8">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.5em] text-neutral-400 font-bold block mb-4">
                    The Dahriola Archive
                  </span>

                  <h2 className="font-display text-4xl md:text-5xl lowercase text-neutral-900 leading-[0.95] tracking-tighter">
                    join the inner <br />
                    <span className="text-brand-beryl italic">
                      circle.
                    </span>
                  </h2>
                </div>

                <p className="text-[11px] uppercase tracking-widest leading-relaxed text-neutral-500 max-w-[320px]">
                  Receive exclusive collection previews, birthday surprises,
                  bespoke invitations, and private releases.
                </p>

                {submitted ? (
                  <div className="py-10">
                    <p className="text-[12px] uppercase tracking-[0.3em] text-brand-beryl font-semibold">
                      Thank you for joining Dahriola.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5 pt-4"
                  >
                    <div>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        placeholder="FULL NAME"
                        className="w-full bg-transparent border-b border-neutral-200 pb-4 text-[11px] tracking-[0.25em] focus:outline-none focus:border-brand-beryl transition-all duration-700 placeholder:text-neutral-300"
                      />
                    </div>

                    <div>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email: e.target.value,
                          })
                        }
                        placeholder="EMAIL ADDRESS"
                        className="w-full bg-transparent border-b border-neutral-200 pb-4 text-[11px] tracking-[0.25em] focus:outline-none focus:border-brand-beryl transition-all duration-700 placeholder:text-neutral-300"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={formData.birthday}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birthday: e.target.value,
                          })
                        }
                        placeholder="BIRTHDAY (MM/DD)"
                        className="w-full bg-transparent border-b border-neutral-200 pb-4 text-[11px] tracking-[0.25em] focus:outline-none focus:border-brand-beryl transition-all duration-700 placeholder:text-neutral-300"
                      />
                    </div>

                    <div>
                      <select
                        required
                        value={formData.source}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            source: e.target.value,
                          })
                        }
                        className="w-full bg-transparent border-b border-neutral-200 pb-4 text-[11px] uppercase tracking-[0.25em] focus:outline-none focus:border-brand-beryl transition-all duration-700 text-neutral-500"
                      >
                        <option value="">
                          HOW DID YOU FIND US?
                        </option>

                        <option value="Instagram">
                          Instagram
                        </option>

                        <option value="TikTok">
                          TikTok
                        </option>

                        <option value="Google">
                          Google
                        </option>

                        <option value="Friend / Referral">
                          Friend / Referral
                        </option>

                        <option value="Pinterest">
                          Pinterest
                        </option>

                        <option value="Event">
                          Event
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 bg-neutral-900 text-white text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-brand-beryl transition-all duration-500 flex items-center justify-center gap-3 group"
                    >
                      {loading ? "Submitting..." : "Subscribe"}

                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-2 transition-transform duration-500"
                      />
                    </button>
                  </form>
                )}

                <p className="text-[8px] uppercase tracking-[0.2em] text-neutral-300 text-center italic">
                  No spam. Just precision and vision.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}