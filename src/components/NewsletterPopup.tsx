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
    const alreadyClosed = localStorage.getItem(
      "dahriola-newsletter-closed"
    );

    if (alreadyClosed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const closePopup = () => {
    localStorage.setItem(
      "dahriola-newsletter-closed",
      "true"
    );

    setIsOpen(false);
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(
        "/api/newsletter",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);

        localStorage.setItem(
          "dahriola-newsletter-closed",
          "true"
        );

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
        <div className="fixed inset-0 z-[200] overflow-y-auto">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* MODAL */}
          <div className="relative min-h-screen flex items-center justify-center py-6 px-4 md:px-6">
            <motion.div
              initial={{
                opacity: 0,
                y: 40,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 30,
                scale: 0.96,
              }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative w-[92%] md:w-full max-w-[950px] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row mx-auto"
            >
              {/* CLOSE */}
              <button
                onClick={closePopup}
                className="absolute top-3 right-3 md:top-6 md:right-6 z-30 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-neutral-100 transition-colors text-neutral-700"
              >
                <X
                  size={18}
                  strokeWidth={1.7}
                />
              </button>

              {/* IMAGE SIDE */}
              <div className="relative w-full md:w-1/2 h-[320px] md:h-auto bg-neutral-100 flex-shrink-0">
                {/* MOBILE */}
                <div className="block md:hidden h-full">
                  <img
                    src="/newsletter_2.jpg"
                    alt="Dahriola"
                    className="w-full h-full object-cover rounded-t-2xl"
                  />
                </div>

                {/* DESKTOP */}
                <div className="hidden md:block absolute inset-0">
                  <Image
                    src="/newsletter_2.jpg"
                    alt="Dahriola"
                    fill
                    className="object-fill rounded-l-2xl"
                  />
                </div>

                <div className="absolute inset-0 bg-black/10 md:rounded-l-2xl rounded-t-2xl" />
              </div>

              {/* CONTENT SIDE */}
              <div className="w-full md:w-1/2 p-5 md:p-12 flex flex-col justify-center">
                <div className="space-y-5">
                  {/* TOP */}
                  <div>
                    <span className="text-[8px] md:text-[9px] uppercase tracking-[0.45em] text-neutral-400 font-bold block mb-4">
                      The Dahriola Archive
                    </span>

                    <h2 className="font-display text-3xl md:text-5xl lowercase text-neutral-900 leading-[0.95] tracking-tighter">
                      join the inner <br />

                      <span className="text-brand-beryl italic">
                        circle.
                      </span>
                    </h2>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-[9px] md:text-[11px] uppercase tracking-[0.18em] leading-relaxed text-neutral-500 max-w-[320px]">
                    Receive exclusive collection previews,
                    birthday surprises, private
                    invitations, and early access to
                    future releases.
                  </p>

                  {/* SUCCESS */}
                  {submitted ? (
                    <div className="py-8">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-brand-beryl font-semibold">
                        Thank you for joining Dahriola.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmit}
                      className="space-y-4 pt-2"
                    >
                      {/* NAME + BIRTHDAY */}
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name:
                                e.target.value,
                            })
                          }
                          placeholder="FULL NAME"
                          className="w-full bg-transparent border-b border-neutral-200 pb-3 text-[10px] tracking-[0.18em] focus:outline-none focus:border-brand-beryl placeholder:text-neutral-300"
                        />

                        <input
                          type="text"
                          value={formData.birthday}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              birthday:
                                e.target.value,
                            })
                          }
                          placeholder="BIRTHDAY(DD/MM)"
                          className="w-full bg-transparent border-b border-neutral-200 pb-3 text-[10px] tracking-[0.18em] focus:outline-none focus:border-brand-beryl placeholder:text-neutral-300"
                        />
                      </div>

                      {/* EMAIL */}
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email:
                              e.target.value,
                          })
                        }
                        placeholder="EMAIL ADDRESS"
                        className="w-full bg-transparent border-b border-neutral-200 pb-3 text-[10px] tracking-[0.18em] focus:outline-none focus:border-brand-beryl placeholder:text-neutral-300"
                      />

                      {/* SOURCE */}
                      <select
                        required
                        value={formData.source}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            source:
                              e.target.value,
                          })
                        }
                        className="w-full bg-transparent border-b border-neutral-200 pb-3 text-[10px] uppercase tracking-[0.18em] focus:outline-none focus:border-brand-beryl text-neutral-500"
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

                        <option value="Pinterest">
                          Pinterest
                        </option>

                        <option value="Friend / Referral">
                          Friend / Referral
                        </option>

                        <option value="Event">
                          Event
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </select>

                      {/* BUTTON */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-neutral-900 text-white text-[10px] uppercase tracking-[0.35em] font-bold hover:bg-brand-beryl transition-all duration-500 flex items-center justify-center gap-3 group"
                      >
                        {loading
                          ? "Submitting..."
                          : "Subscribe"}

                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-2 transition-transform duration-500"
                        />
                      </button>
                    </form>
                  )}

                  {/* FOOTER */}
                  <p className="text-[7px] uppercase tracking-[0.12em] text-neutral-300 text-center italic pt-1">
                    No spam. Just precision and
                    vision.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}