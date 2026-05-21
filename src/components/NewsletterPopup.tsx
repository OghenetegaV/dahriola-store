"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Copy,
} from "lucide-react";
import Image from "next/image";

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      birthday: "",
      source: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [
    discountCode,
    setDiscountCode,
  ] = useState("");

  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    const claimed =
      localStorage.getItem(
        "dahriola_discount_claimed"
      );

    if (claimed) return;

    const timer =
      setTimeout(() => {
        setIsOpen(true);
      }, 5000);

    return () =>
      clearTimeout(timer);
  }, []);

  const closePopup = () => {
    localStorage.setItem(
      "dahriola-newsletter-closed",
      "true"
    );

    setIsOpen(false);
  };

  const copyCode =
    async () => {
      try {
        await navigator.clipboard.writeText(
          discountCode ||
            "WELCOME10"
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {}
    };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/newsletter",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                formData
              ),
          }
        );

      const data =
        await response.json();

      if (data.success) {
        setSubmitted(true);

        setDiscountCode(
          data.code ||
            "WELCOME10"
        );

        localStorage.setItem(
          "dahriola_discount_claimed",
          "true"
        );

        setFormData({
          name: "",
          email: "",
          birthday: "",
          source: "",
        });
      }
    } catch (error) {
      console.log(error);
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
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={closePopup}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
          />

          <div className="relative min-h-screen flex items-center justify-center p-4">
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="relative bg-white rounded-2xl w-full max-w-[950px] flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
            >
              {/* CLOSE */}
              <button
                onClick={closePopup}
                className="absolute right-4 top-4 z-50 bg-white rounded-full p-2"
              >
                <X size={18} />
              </button>

              {/* IMAGE */}
              <div className="relative w-full md:w-1/2 h-[320px] md:h-auto">
                <Image
                  src="/newsletter_2.jpg"
                  alt="Dahriola"
                  fill
                  priority
                  className="object-cover object-top"
                />
              </div>

              {/* CONTENT */}
              <div className="w-full md:w-1/2 overflow-y-auto">
                <div className="p-6 md:p-12">
                  {!submitted ? (
                    <>
                      <span className="text-[9px] tracking-[0.4em] uppercase text-neutral-400">
                        The Dahriola Archive
                      </span>

                      <h2 className="mt-5 text-4xl leading-none">
                        Get 10% Off
                        <br />
                        Your First Order
                      </h2>

                      <p className="mt-4 text-sm text-neutral-500">
                        Join for exclusive
                        previews,
                        birthday surprises and
                        early access.
                      </p>

                      <form
                        onSubmit={
                          handleSubmit
                        }
                        className="space-y-5 mt-8"
                      >
                        <input
                          required
                          placeholder="FULL NAME"
                          value={
                            formData.name
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full border-b pb-3"
                        />

                        <input
                          type="email"
                          required
                          placeholder="EMAIL"
                          value={
                            formData.email
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full border-b pb-3"
                        />

                        <input
                          type="month"
                          value={
                            formData.birthday
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              birthday:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full border-b pb-3"
                        />

                        <select
                          required
                          value={
                            formData.source
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              source:
                                e.target
                                  .value,
                            })
                          }
                          className="w-full border-b pb-3"
                        >
                          <option value="">
                            How did you find us?
                          </option>

                          <option>
                            Instagram
                          </option>

                          <option>
                            TikTok
                          </option>

                          <option>
                            Google
                          </option>

                          <option>
                            Friend
                          </option>

                          <option>
                            Pinterest
                          </option>
                        </select>

                        <button
                          disabled={
                            loading
                          }
                          className="w-full bg-black text-white py-4 flex justify-center gap-3"
                        >
                          {loading
                            ? "Submitting..."
                            : "Unlock My Discount"}

                          <ArrowRight />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="uppercase text-sm">
                        Your discount code
                      </p>

                      <div
                        onClick={
                          copyCode
                        }
                        className="cursor-pointer border py-6 mt-5"
                      >
                        <h1 className="text-4xl font-bold tracking-[0.08em]">
                          {discountCode ||
                            "WELCOME10"}
                        </h1>

                        <div className="mt-4 flex justify-center gap-2 text-sm">
                          <Copy
                            size={14}
                          />

                          {copied
                            ? "Copied"
                            : "Tap to copy"}
                        </div>
                      </div>

                      <p className="mt-6 text-xs text-neutral-400 uppercase tracking-[0.25em]">
                        Apply at checkout
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}