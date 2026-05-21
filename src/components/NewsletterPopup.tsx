"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowRight,
  X,
  Copy,
} from "lucide-react";

import Image from "next/image";

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [
    discountCode,
    setDiscountCode,
  ] = useState("");

  const [
    alreadySubscribed,
    setAlreadySubscribed,
  ] = useState(false);

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      birthday: "",
      source: "",
    });

  useEffect(() => {
    const hidden =
      localStorage.getItem(
        "dahriola-newsletter-closed"
      );

    if (hidden) return;

    const timer = setTimeout(() => {
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

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const res =
        await fetch(
          "/api/newsletter",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              formData
            ),
          }
        );

      const data =
        await res.json();

      if (data.success) {
        setSubmitted(true);

        setDiscountCode(
          data.discountCode || ""
        );

        setAlreadySubscribed(
          data.alreadySubscribed
        );

        localStorage.setItem(
          "dahriola-newsletter-closed",
          "true"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(
      discountCode
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto">

          <motion.div
            className="fixed inset-0 bg-black/50"
            onClick={closePopup}
          />

          <div className="min-h-screen flex items-center justify-center p-4">

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="relative w-full max-w-[950px] bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row"
            >
              <button
                onClick={closePopup}
                className="absolute top-5 right-5 z-50"
              >
                <X />
              </button>

              <div className="relative md:w-1/2 h-[320px]">

                <Image
                  src="/newsletter_2.jpg"
                  fill
                  alt=""
                  className="object-cover"
                />

              </div>

              <div className="md:w-1/2 p-8 md:p-14">

                {!submitted ? (
                  <>
                    <h2 className="text-4xl mb-5">
                      Join the Inner Circle
                    </h2>

                    <form
                      onSubmit={
                        handleSubmit
                      }
                      className="space-y-5"
                    >
                      <input
                        required
                        placeholder="Name"
                        className="w-full border-b p-3"
                        value={
                          formData.name
                        }
                        onChange={(
                          e
                        ) =>
                          setFormData(
                            {
                              ...formData,
                              name:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <input
                        required
                        type="email"
                        placeholder="Email"
                        className="w-full border-b p-3"
                        value={
                          formData.email
                        }
                        onChange={(
                          e
                        ) =>
                          setFormData(
                            {
                              ...formData,
                              email:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <input
                        placeholder="Birthday"
                        className="w-full border-b p-3"
                        value={
                          formData.birthday
                        }
                        onChange={(
                          e
                        ) =>
                          setFormData(
                            {
                              ...formData,
                              birthday:
                                e.target
                                  .value,
                            }
                          )
                        }
                      />

                      <select
                        required
                        className="w-full border-b p-3"
                        value={
                          formData.source
                        }
                        onChange={(
                          e
                        ) =>
                          setFormData(
                            {
                              ...formData,
                              source:
                                e.target
                                  .value,
                            }
                          )
                        }
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
                          Referral
                        </option>
                      </select>

                      <button
                        disabled={
                          loading
                        }
                        className="w-full bg-black text-white py-4"
                      >
                        {loading
                          ? "Submitting..."
                          : "Unlock Offer"}

                        <ArrowRight className="inline ml-3" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center">

                    {alreadySubscribed ? (
                      <>
                        <h2 className="text-3xl">
                          You're already in
                        </h2>

                        <p className="mt-3">
                          One welcome code
                          per email.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-3xl">
                          Welcome
                        </h2>

                        <p className="mt-4">
                          Your discount code
                        </p>

                        <div className="border py-6 mt-5">

                          <div className="text-3xl font-bold tracking-[0.3em]">
                            {discountCode}
                          </div>

                        </div>

                        <button
                          onClick={
                            copyCode
                          }
                          className="mt-5"
                        >
                          <Copy />
                        </button>
                      </>
                    )}
                  </div>
                )}

              </div>
            </motion.div>

          </div>

        </div>
      )}
    </AnimatePresence>
  );
}