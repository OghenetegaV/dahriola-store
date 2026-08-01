"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/src/store/useStore";
import Image from "next/image";
import { usePaystackPayment } from "react-paystack";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import {
  getTerminalCountries,
  getTerminalStates,
  getTerminalCities,
} from "@/src/app/actions/terminalLocations";
import { getShippingRates } from "@/src/app/actions/shipping";
import { verifyPayment } from "@/src/app/actions/payment";
import { validateCoupon } from "@/src/app/actions/coupon";
import { sendOrderNotification } from "@/src/app/actions/email";
import { createOrder } from "@/src/app/actions/order";
import { reducePrintStockAfterOrder } from "@/src/app/actions/inventory";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { client, urlFor } from "@/src/lib/sanity";

export default function CheckoutClient() {
  const router = useRouter();

  const {
    cart,
    currency,
    exchangeRates,
    clearCart,
    addItem,
    updateItemOptions,
    removeItem,
  } = useStore();

  const [hasHydrated, setHasHydrated] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const [selectedCountryCode, setSelectedCountryCode] = useState("NG");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [textOptIn, setTextOptIn] = useState(false);
  const [selectedStateCode, setSelectedStateCode] = useState("");

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [upsellProducts, setUpsellProducts] = useState<any[]>([]);
  const [selectedUpsell, setSelectedUpsell] = useState<any | null>(null);
  const [upsellSize, setUpsellSize] = useState("M");
  const [upsellQuantity, setUpsellQuantity] = useState(1);

  const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editSize, setEditSize] = useState("M");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "NG",
  });

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditSize(item.size || "M");
    setEditQuantity(item.quantity || 1);
    setEditNotes(item.notes || "");
  };

  const saveEditedItem = () => {
    if (!editingItem) return;

    updateItemOptions(
      editingItem._id,
      editingItem.size,
      {
        size: editSize,
        quantity: editQuantity,
        notes: editNotes,
      },
      editingItem.selectedPrintId
    );

    setEditingItem(null);
  };

  useEffect(() => {
    setHasHydrated(true);

    async function fetchUpsells() {
      try {
        const cartIds = cart.map((item) => item._id);

        const products = await client.fetch(
          `*[_type == "product" && !(_id in $cartIds)][0...4]{
            _id,
            name,
            priceNGN,
            images,
            "slug": slug.current
          }`,
          { cartIds }
        );

        setUpsellProducts(products || []);
      } catch (error) {
        console.error("Upsell fetch error:", error);
      }
    }

    fetchUpsells();
  }, [cart]);

  useEffect(() => {
    async function loadCountries() {
      setLoadingCountries(true);

      try {
        const terminalCountries = await getTerminalCountries();

        if (terminalCountries.length > 0) {
          setCountries(terminalCountries);

          const nigeria =
            terminalCountries.find((country) => country.code === "NG") ||
            terminalCountries[0];

          setSelectedCountryCode(nigeria.code);

          setFormData((prev) => ({
            ...prev,
            country: nigeria.code,
          }));
        }
      } catch (error) {
        console.error("Country loading error:", error);
      } finally {
        setLoadingCountries(false);
      }
    }

    loadCountries();
  }, []);

  useEffect(() => {
    async function loadStates() {
      if (!selectedCountryCode) return;

      setLoadingStates(true);
      setStates([]);
      setCities([]);
      setSelectedStateCode("");
      setSelectedRate(null);
      setShippingRates([]);

      setFormData((prev) => ({
        ...prev,
        country: selectedCountryCode,
        state: "",
        city: "",
      }));

      try {
        const terminalStates = await getTerminalStates(selectedCountryCode);
        setStates(terminalStates || []);
      } catch (error) {
        console.error("State loading error:", error);
      } finally {
        setLoadingStates(false);
      }
    }

    loadStates();
  }, [selectedCountryCode]);

  useEffect(() => {
    async function loadCities() {
      if (!selectedCountryCode) return;

      setLoadingCities(true);
      setCities([]);
      setSelectedRate(null);
      setShippingRates([]);

      setFormData((prev) => ({
        ...prev,
        city: "",
      }));

      try {
        const terminalCities = await getTerminalCities(
          selectedCountryCode,
          selectedStateCode
        );

        setCities(terminalCities || []);
      } catch (error) {
        console.error("City loading error:", error);
      } finally {
        setLoadingCities(false);
      }
    }

    loadCities();
  }, [selectedCountryCode, selectedStateCode]);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const convertedSubtotal = subtotal * (exchangeRates[currency] || 1);

  const fetchRates = async () => {
    // Require the core address fields for EVERY country. The country selector is
    // the single source of truth for where this ships — the state/region and
    // city must be filled in too, so a foreign address can't be quoted at
    // Nigerian domestic rates just because the country was left as NG.
    if (
      !formData.address.trim() ||
      !formData.country ||
      !formData.city.trim() ||
      !formData.state.trim()
    ) {
      setShippingError(
        "Please complete your full address — country, state/region, city, and street — before fetching shipping options."
      );
      return;
    }

    setLoadingRates(true);
    setShippingError(null);

    try {
      const totalQuantity = cart.reduce((n, item) => n + item.quantity, 0);
      const rates = await getShippingRates({
        line1: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        itemCount: totalQuantity,        // drives weight-based pricing
      });

      if (rates && rates.length > 0) {
        setShippingRates(rates);
        setSelectedRate(rates[0]);
      } else {
        setShippingRates([]);
        setShippingError("No shipping rates found for this location.");
      }
    } catch {
      setShippingError("Unable to fetch rates. Please check your connection.");
    } finally {
      setLoadingRates(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode) return;

    setIsApplying(true);
    setDiscountError(null);

    try {
      const result = await validateCoupon(discountCode);

      if (result.success) {
        const savings =
          result.discountType === "percentage"
            ? convertedSubtotal * (result.discountValue / 100)
            : result.discountValue * (exchangeRates[currency] || 1);

        setDiscountAmount(savings);
      } else {
        setDiscountError(result.message);
        setDiscountAmount(0);
      }
    } catch {
      setDiscountError("Error validating code.");
    } finally {
      setIsApplying(false);
    }
  };

  const shippingAmountNGN = selectedRate ? selectedRate.amount : 0;

  const convertedShipping =
    currency === "NGN"
      ? shippingAmountNGN
      : shippingAmountNGN * (exchangeRates[currency] || 1);

  const finalTotal = convertedSubtotal + convertedShipping - discountAmount;

  const exchangeRate = exchangeRates[currency] || 1;

  const finalTotalNGN =
    currency === "NGN" ? finalTotal : finalTotal / exchangeRate;

  const paystackConfig = {
    reference: `dahriola-${Date.now()}`,
    email: formData.email,
    amount: Math.round(finalTotalNGN * 100),
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    currency: "NGN",
    metadata: {
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: formData.name,
        },
        {
          display_name: "Phone Number",
          variable_name: "phone_number",
          value: formData.phone,
        },
        {
          display_name: "Display Currency",
          variable_name: "display_currency",
          value: currency,
        },
        {
          display_name: "Display Total",
          variable_name: "display_total",
          value: finalTotal,
        },
      ],
    },
  };

  // @ts-ignore
  const initializePayment = usePaystackPayment(paystackConfig);

  // Verify with a couple of retries so a single Paystack hiccup or cold start
  // doesn't leave the `verified` flag wrong. This NEVER blocks fulfilment.
  const verifyPaymentWithRetry = async (
    reference: string,
    attempts = 3,
  ): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      try {
        const result = await verifyPayment(reference);
        if (result?.success) return true;
      } catch (err) {
        console.error(`Verification attempt ${i + 1} threw:`, err);
      }
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      }
    }
    return false;
  };

  // Records the order in Sanity + emails the client. Called whenever Paystack's
  // onSuccess fires — money has already moved, so this must run regardless of
  // the verification result. Field names match the Sanity `order` schema, and
  // each step is guarded independently so one failure never blocks the others.
  const fulfilOrder = async (transactionReference: string, verified: boolean) => {
    try {
      await reducePrintStockAfterOrder(cart);
    } catch (stockErr) {
      console.error("Stock reduction failed:", stockErr);
    }

    // 2. Save the order to Sanity via the server action (browser writes are
    //    rejected — the write token only exists server-side).
    try {
      const orderResult = await createOrder({
        orderNumber: transactionReference,
        customerName: formData.name,
        customerEmail: formData.email,
        shippingAddress: [
          formData.address,
          formData.apartment,
          formData.city,
          formData.state,
          formData.postalCode,
          formData.country,
        ].filter(Boolean).join(", "),
        currency: currency,
        totalAmount: finalTotal,
        paymentVerified: verified,
        emailOptIn: emailOptIn,
        textOptIn: textOptIn,
        items: cart.map((item) => ({
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          selectedPrintId: item.selectedPrintId,
          selectedPrintName: item.selectedPrintName || "",
          notes: item.notes || "",
        })),
      });
      if (!orderResult.success) {
        console.error("Order save failed:", orderResult.message);
      }
    } catch (sanityErr) {
      console.error("SANITY SAVE FAILED:", sanityErr);
    }

    try {
      await sendOrderNotification({
        orderNumber: transactionReference,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: [
          formData.address,
          formData.apartment,
          formData.city,
          formData.state,
          formData.postalCode,
          formData.country,
        ].filter(Boolean).join(", "),
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          selectedPrintName: item.selectedPrintName || "",
          notes: item.notes || "",
        })),
        subtotal: convertedSubtotal,
        shippingFee: convertedShipping,
        shippingMethod: selectedRate
          ? `${selectedRate.service_name || selectedRate.carrier_name}${
              selectedRate.delivery_time ? ` — ${selectedRate.delivery_time}` : ""
            }`
          : undefined,
        totalAmount: finalTotal,
        currency,
        paymentReference: transactionReference,
        paymentVerified: verified,
        orderDate: new Date().toISOString(),
      });
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    setIsProcessing(true);

    // react-paystack only fires onSuccess AFTER a successful charge, so the
    // customer has been debited. The order must be recorded and the client
    // notified no matter what verification says — verification only sets a flag.
    const transactionReference = response.reference || response.trxref;

    let verified = false;
    try {
      verified = await verifyPaymentWithRetry(transactionReference);
    } catch (err) {
      console.error("Verification error (continuing to fulfil):", err);
    }

    try {
      await fulfilOrder(transactionReference, verified);
      clearCart();
      router.push(`/success?reference=${transactionReference}`);
    } catch (error) {
      console.error("CRITICAL ERROR IN PAYMENT HANDLER:", error);
      setShippingError(
        `Your payment went through but we hit a snag saving your order. Please contact us with your payment reference (${transactionReference}) and we'll complete it right away.`,
      );
      setIsProcessing(false);
    }
  };

  const handleAddUpsell = (product: any) => {
    setSelectedUpsell(product);
    setUpsellSize("M");
    setUpsellQuantity(1);
  };

  if (!hasHydrated) return null;

  const confirmAddUpsell = () => {
    if (!selectedUpsell) return;

    addItem({
      _id: selectedUpsell._id,
      name: selectedUpsell.name,
      price: selectedUpsell.priceNGN,
      image: selectedUpsell.images?.[0]
        ? urlFor(selectedUpsell.images[0]).url()
        : "",
      quantity: upsellQuantity,
      size: upsellSize,
      notes: "",
    });

    setSelectedUpsell(null);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f4] pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-[1180px] mx-auto">
        <div className="mb-6">
          <Link
            href="/category/all"
            className="text-[13px] text-neutral-500 hover:text-brand-beryl"
          >
            ← Back to Shop
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.85fr] gap-12 items-start">
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 md:p-8 shadow-sm">
            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl text-black mb-2">
                Checkout
              </h1>
              <p className="text-sm text-neutral-500">
                Complete your delivery details. Payment is handled securely by
                Paystack.
              </p>
            </div>

            <div className="mb-8 rounded-xl border border-neutral-200 bg-[#fbfbfa] p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-black">
                    Secure checkout with Paystack
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Pay securely with card, bank transfer, USSD, OPay, and other
                    supported payment options.
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-3">
                  <img
                    src="/payment-logos/paystack.svg"
                    alt="Paystack"
                    className="h-6 w-auto"
                  />
                  <img
                    src="/payment-logos/visa.svg"
                    alt="Visa"
                    className="h-5 w-auto"
                  />
                  <img
                    src="/payment-logos/mastercard.svg"
                    alt="Mastercard"
                    className="h-5 w-auto"
                  />
                  <img
                    src="/payment-logos/verve.svg"
                    alt="Verve"
                    className="h-5 w-auto"
                  />
                  <img
                    src="/payment-logos/opay.svg"
                    alt="OPay"
                    className="h-5 w-auto"
                  />
                </div>
              </div>
            </div>

            <section className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[17px] font-semibold text-black">
                    Contact
                  </h2>
                  <button className="text-[12px] underline text-neutral-500">
                    Sign in
                  </button>
                </div>

                <input
                  type="email"
                  placeholder="Email"
                  className="checkout-field"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />

                <label className="mt-3 flex items-center gap-2 text-[12px] text-neutral-600">
                  <input
                    type="checkbox"
                    className="accent-black"
                    checked={emailOptIn}
                    onChange={(e) => setEmailOptIn(e.target.checked)}
                  />
                  Email me with news and offers
                </label>
              </div>

              <div>
                <h2 className="text-[17px] font-semibold text-black mb-3">
                  Delivery
                </h2>

                <div className="relative mb-3">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => {
                      setSelectedCountryCode(e.target.value);
                      setSelectedRate(null);
                      setShippingRates([]);
                    }}
                    className="checkout-field appearance-none"
                    disabled={loadingCountries}
                  >
                    {loadingCountries ? (
                      <option>Loading countries...</option>
                    ) : (
                      countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))
                    )}
                  </select>

                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="First name"
                    className="checkout-field"
                    value={formData.name.split(" ")[0] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <input
                    placeholder="Last name"
                    className="checkout-field"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: `${formData.name} ${e.target.value}`,
                      })
                    }
                  />
                </div>

                <input
                  placeholder="Address"
                  className="checkout-field mt-3"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />

                <input
                  placeholder="Apartment, suite, etc. (optional)"
                  className="checkout-field mt-3"
                  value={formData.apartment}
                  onChange={(e) =>
                    setFormData({ ...formData, apartment: e.target.value })
                  }
                />

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="relative">
                    {states.length > 0 ? (
                      <>
                        <select
                          className="checkout-field appearance-none"
                          value={selectedStateCode}
                          disabled={loadingStates}
                          onChange={(e) => {
                            const stateCode = e.target.value;
                            const selectedState = states.find(
                              (state) => state.code === stateCode
                            );

                            setSelectedStateCode(stateCode);
                            setSelectedRate(null);
                            setShippingRates([]);

                            setFormData((prev) => ({
                              ...prev,
                              state: selectedState?.name || "",
                            }));
                          }}
                        >
                          <option value="">
                            {loadingStates ? "Loading states..." : "State"}
                          </option>

                          {states.map((state) => (
                            <option key={state.code} value={state.code}>
                              {state.name}
                            </option>
                          ))}
                        </select>

                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                      </>
                    ) : (
                      <input
                        placeholder="State / Region"
                        className="checkout-field"
                        value={formData.state}
                        onChange={(e) => {
                          setSelectedRate(null);
                          setShippingRates([]);
                          setFormData((prev) => ({ ...prev, state: e.target.value }));
                        }}
                      />
                    )}
                  </div>

                  <input
                    placeholder="City"
                    className="checkout-field"
                    value={formData.city}
                    onChange={(e) => {
                      setSelectedRate(null);
                      setShippingRates([]);
                      setFormData((prev) => ({ ...prev, city: e.target.value }));
                    }}
                  />

                  <input
                    placeholder="Postal code optional"
                    className="checkout-field"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                  />
                </div>

                <input
                  placeholder="Phone"
                  className="checkout-field mt-3"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={fetchRates}
                  disabled={
                    loadingRates ||
                    !formData.address.trim() ||
                    !formData.country ||
                    !formData.city.trim() ||
                    !formData.state.trim()
                  }
                  className="mt-4 w-full h-11 rounded-lg border border-brand-beryl text-brand-beryl text-[12px] font-semibold hover:bg-brand-beryl hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loadingRates
                    ? "Fetching shipping options..."
                    : "Get Shipping Options"}
                </button>

                <label className="mt-3 flex items-center gap-2 text-[12px] text-neutral-600">
                  <input
                    type="checkbox"
                    className="accent-black"
                    checked={textOptIn}
                    onChange={(e) => setTextOptIn(e.target.checked)}
                  />
                  Text me with news and offers
                </label>
              </div>

              <div>
                <h2 className="text-[17px] font-semibold text-black mb-3">
                  Shipping method
                </h2>

                {loadingRates ? (
                  <div className="checkout-muted">
                    <Loader2 size={14} className="animate-spin" />
                    Calculating rates...
                  </div>
                ) : shippingRates.length > 0 ? (
                  <div className="space-y-2">
                    {shippingRates.map((rate) => (
                      <label
                        key={rate.id}
                        className={`flex items-center justify-between rounded-lg border p-4 text-[13px] cursor-pointer ${
                          selectedRate?.id === rate.id
                            ? "border-brand-beryl bg-brand-beryl/5"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={selectedRate?.id === rate.id}
                            onChange={() => setSelectedRate(rate)}
                            className="accent-black"
                          />
                          <div>
                            <p className="text-[13px] font-medium">
                              {rate.service_name || rate.carrier_name}
                            </p>
                            <p className="text-[11px] text-neutral-500">
                              {rate.carrier_name} • {rate.delivery_time}
                            </p>
                          </div>
                        </div>
                        <span>₦{rate.amount.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="checkout-muted">
                    Enter your shipping address to view available shipping
                    methods.
                  </div>
                )}

                {shippingError && (
                  <p className="text-[12px] text-red-500 mt-2">
                    {shippingError}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setIsProcessing(true);
                  initializePayment({
                    onSuccess: handlePaymentSuccess,
                    onClose: () => setIsProcessing(false),
                  });
                }}
                disabled={
                  !selectedRate ||
                  !formData.email ||
                  !formData.name.trim() ||
                  !formData.phone.trim() ||
                  !formData.address.trim() ||
                  !formData.city.trim() ||
                  !formData.state.trim() ||
                  !formData.country ||
                  isProcessing
                }
                className="w-full h-14 rounded-lg bg-brand-beryl text-white text-[14px] font-semibold hover:opacity-95 transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Continue to Paystack
                  </>
                )}
              </button>

              <div className="flex justify-center gap-2 text-[11px] text-neutral-400">
                <ShieldCheck size={13} /> Secure Checkout by Paystack
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <h2 className="text-[17px] font-semibold text-black mb-5">
                Order Summary
              </h2>

              <div className="space-y-5">
                {cart.map((item) => (
                  <div
                    key={`${item._id}-${item.size}-${
                      item.selectedPrintId || ""
                    }`}
                    className="flex gap-4 items-start"
                  >
                    <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-neutral-100 border shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex-1">
                      <p className="text-[13px] font-medium leading-snug">
                        {item.name}
                      </p>

                      <p className="text-[11px] text-neutral-500 mt-1">
                        Size: {item.size} • Qty: {item.quantity}
                      </p>

                      <div className="flex items-center gap-3 mt-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="text-[11px] underline text-neutral-500 hover:text-black transition"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              item._id,
                              item.size,
                              item.selectedPrintId
                            )
                          }
                          className="text-[11px] underline text-red-500 hover:text-red-700 transition inline-flex items-center gap-1"
                        >
                          <Trash2 size={11} />
                          Remove
                        </button>
                      </div>
                    </div>

                    <p className="text-[13px] font-semibold">
                      {formatMoney(
                        item.price *
                          item.quantity *
                          (exchangeRates[currency] || 1)
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-6">
                <input
                  type="text"
                  placeholder="Discount code or gift card"
                  className="checkout-field flex-1"
                  value={discountCode}
                  onChange={(e) =>
                    setDiscountCode(e.target.value.toUpperCase())
                  }
                />
                <button
                  onClick={handleApplyDiscount}
                  disabled={isApplying}
                  className="px-5 rounded-lg bg-neutral-100 text-[12px] font-medium"
                >
                  {isApplying ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center gap-2 text-green-600 text-[12px] mt-3">
                  <CheckCircle2 size={13} />
                  Discount Applied
                </div>
              )}

              {discountError && (
                <p className="text-[12px] text-red-500 mt-3">
                  {discountError}
                </p>
              )}

              {upsellProducts.length > 0 && (
                <div className="mt-8 rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-black">
                      You may also like
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {upsellProducts.slice(0, 2).map((product) => (
                      <div key={product._id} className="text-center">
                        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-neutral-100 mb-3">
                          {product.images?.[0] && (
                            <Image
                              src={urlFor(product.images[0]).url()}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>

                        <p className="text-[12px] font-semibold leading-snug line-clamp-2">
                          {product.name}
                        </p>

                        <p className="text-[11px] text-neutral-500 mt-1">
                          {formatMoney(
                            product.priceNGN * (exchangeRates[currency] || 1)
                          )}
                        </p>

                        <button
                          onClick={() => handleAddUpsell(product)}
                          className="mt-3 w-full h-10 rounded-lg border border-neutral-200 text-brand-beryl text-[12px] font-semibold hover:border-brand-beryl transition flex items-center justify-center gap-1"
                        >
                          <Plus size={13} />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-6 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal</span>
                  <span>{formatMoney(convertedSubtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">Shipping</span>
                  <span>
                    {selectedRate ? formatMoney(convertedShipping) : "—"}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatMoney(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t text-[17px] font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(finalTotal)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .checkout-field {
          width: 100%;
          height: 46px;
          border: 1px solid #d8d8d8;
          border-radius: 8px;
          background: white;
          padding: 0 13px;
          font-size: 13px;
          outline: none;
        }

        .checkout-field:focus {
          border-color: #778472;
          box-shadow: 0 0 0 1px #778472;
        }

        .checkout-muted {
          min-height: 48px;
          border-radius: 8px;
          background: #f2f2f2;
          color: #777;
          font-size: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      {editingItem && (
        <div
          className="fixed inset-0 z-[250] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-black">Edit Item</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {editingItem.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                <Image
                  src={editingItem.image}
                  alt={editingItem.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-black">
                  {editingItem.name}
                </p>

                <p className="text-sm text-neutral-500 mt-2">
                  {formatMoney(
                    editingItem.price *
                      editQuantity *
                      (exchangeRates[currency] || 1)
                  )}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[12px] font-semibold uppercase tracking-widest mb-3">
                Size
              </p>

              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setEditSize(size)}
                    className={`min-w-11 h-10 px-3 rounded-md border text-[13px] ${
                      editSize === size
                        ? "bg-brand-beryl text-white border-brand-beryl"
                        : "bg-white text-black border-neutral-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[12px] font-semibold uppercase tracking-widest mb-3">
                Quantity
              </p>

              <div className="flex items-center w-32 h-10 border border-neutral-200 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setEditQuantity((q) => Math.max(1, q - 1))}
                  className="flex-1 h-full"
                >
                  -
                </button>

                <span className="w-10 text-center text-sm">
                  {editQuantity}
                </span>

                <button
                  type="button"
                  onClick={() => setEditQuantity((q) => q + 1)}
                  className="flex-1 h-full"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[12px] font-semibold uppercase tracking-widest mb-3">
                Notes
              </p>

              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Custom adjustment notes..."
                className="w-full min-h-[90px] border border-neutral-200 rounded-lg p-3 text-sm outline-none focus:border-brand-beryl resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 h-12 rounded-lg border border-neutral-200 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveEditedItem}
                className="flex-1 h-12 rounded-lg bg-brand-beryl text-white text-sm font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUpsell && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setSelectedUpsell(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                {selectedUpsell.images?.[0] && (
                  <Image
                    src={urlFor(selectedUpsell.images[0]).url()}
                    alt={selectedUpsell.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div>
                <h3 className="text-base font-semibold text-black leading-snug">
                  {selectedUpsell.name}
                </h3>
                <p className="text-sm text-neutral-500 mt-2">
                  {formatMoney(
                    selectedUpsell.priceNGN *
                      (exchangeRates[currency] || 1)
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[12px] font-semibold uppercase tracking-widest mb-3">
                Select Size
              </p>

              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setUpsellSize(size)}
                    className={`min-w-11 h-10 px-3 rounded-md border text-[13px] ${
                      upsellSize === size
                        ? "bg-brand-beryl text-white border-brand-beryl"
                        : "bg-white text-black border-neutral-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[12px] font-semibold uppercase tracking-widest mb-3">
                Quantity
              </p>

              <div className="flex items-center w-32 h-10 border border-neutral-200 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setUpsellQuantity((q) => Math.max(1, q - 1))}
                  className="flex-1 h-full"
                >
                  -
                </button>

                <span className="w-10 text-center text-sm">
                  {upsellQuantity}
                </span>

                <button
                  type="button"
                  onClick={() => setUpsellQuantity((q) => q + 1)}
                  className="flex-1 h-full"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedUpsell(null)}
                className="flex-1 h-12 rounded-lg border border-neutral-200 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmAddUpsell}
                className="flex-1 h-12 rounded-lg bg-brand-beryl text-white text-sm font-semibold"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}