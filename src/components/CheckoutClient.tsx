"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/src/store/useStore";
import Image from "next/image";
import { usePaystackPayment } from "react-paystack"; 
import { Loader2, Truck, CreditCard, AlertCircle, RefreshCw, Tag, CheckCircle2, ShieldCheck } from "lucide-react";
import { getShippingRates } from "@/src/app/actions/shipping";
import { verifyPayment } from "@/src/app/actions/payment"; 
import { validateCoupon } from "@/src/app/actions/coupon";
import { sendOrderNotification } from "@/src/app/actions/email";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckoutClient() {
  const router = useRouter();
  const { cart, currency, exchangeRates, clearCart } = useStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
  });

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const convertedSubtotal = subtotal * (exchangeRates[currency] || 1);
  
  const fetchRates = async () => {
    if (!formData.address || !formData.city || !formData.state) return;
    setLoadingRates(true);
    setShippingError(null);
    try {
      const deliveryData = {
        line1: formData.address,
        city: formData.city,
        state: formData.state,
        country: "NG",
      };
      const rates = await getShippingRates(deliveryData);
      if (rates && rates.length > 0) {
        setShippingRates(rates);
        setSelectedRate(rates[0]);
      } else {
        setShippingRates([]);
        setShippingError("No shipping rates found for this location.");
      }
    } catch (error) {
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
        let savings = 0;
        if (result.discountType === 'percentage') {
          savings = convertedSubtotal * (result.discountValue / 100);
        } else {
          savings = result.discountValue * (exchangeRates[currency] || 1);
        }
        setDiscountAmount(savings);
      } else {
        setDiscountError(result.message);
        setDiscountAmount(0);
      }
    } catch (error) {
      setDiscountError("Error validating code.");
    } finally {
      setIsApplying(false);
    }
  };

  const shippingAmountNGN = selectedRate ? selectedRate.amount : 0;
  const convertedShipping = currency === "NGN" 
    ? shippingAmountNGN 
    : shippingAmountNGN * (exchangeRates[currency] || 1);
    
  const finalTotal = convertedSubtotal + convertedShipping - discountAmount;

  const paystackConfig = {
    reference: `dahriola-${(new Date()).getTime().toString()}`,
    email: formData.email,
    amount: Math.round(finalTotal * 100), 
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    currency: currency,
    metadata: {
      custom_fields: [
        { display_name: "Customer Name", variable_name: "customer_name", value: formData.name },
        { display_name: "Phone Number", variable_name: "phone_number", value: formData.phone }
      ]
    }
  };

  // @ts-ignore
  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePaymentSuccess = async (response: any) => {
    setIsProcessing(true);
    try {
      const transactionReference = response.reference || response.trxref;
      const verification = await verifyPayment(transactionReference);
      if (verification.success) {
        await sendOrderNotification({
          orderNumber: transactionReference,
          customerName: formData.name,
          customerEmail: formData.email,
          items: cart,
          totalAmount: finalTotal,
          currency: currency,
          shippingAddress: `${formData.address}, ${formData.city}, ${formData.state}`,
        });
        clearCart();
        router.push(`/success?reference=${transactionReference}`);
      } else {
        setShippingError("Payment verification failed.");
        setIsProcessing(false);
      }
    } catch (error) {
      setIsProcessing(false);
    }
  };

  if (!hasHydrated) return null;

  return (
    <div className="bg-[#F9F9F9] min-h-screen pt-24 pb-16 px-4 md:px-8">
        {/* BACK LINK */}
        <div className="mb-6">
          <Link
            href="/category/all"
            className="text-sm font-medium hover:text-brand-beryl"
          >
            ← Back to Shop
          </Link>
        </div>

      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-12 gap-10">
        
        {/* LEFT: FORM SECTION */}
        <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-neutral-100">
          <header className="mb-10">
            <h1 className="font-display text-4xl text-neutral-900 mb-2">Checkout</h1>
            <p className="text-sm text-neutral-500">Complete your details to finish your order.</p>
          </header>

          <section className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Jane Doe" },
                { label: "Email Address", key: "email", type: "email", placeholder: "jane@example.com" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "+234..." },
                { label: "Street Address", key: "address", type: "text", placeholder: "123 Street Name", blur: true },
                { label: "City", key: "city", type: "text", placeholder: "Lagos", blur: true },
                { label: "State", key: "state", type: "text", placeholder: "Lagos State", blur: true },
              ].map((field) => (
                <div key={field.key} className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-900">{field.label}</label>
                  <input 
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full border border-neutral-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                    value={(formData as any)[field.key]}
                    onBlur={field.blur ? fetchRates : undefined}
                    onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                  />
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-neutral-100">
              <div className="flex items-center gap-2 mb-6">
                <Truck size={18} className="text-neutral-900" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900">Delivery Method</h3>
              </div>
              
              {loadingRates ? (
                <div className="flex items-center gap-3 p-6 bg-neutral-50 rounded-xl border border-neutral-200 animate-pulse">
                  <Loader2 className="animate-spin text-neutral-400" size={18} /> 
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Calculating rates...</span>
                </div>
              ) : shippingRates.length > 0 ? (
                <div className="grid gap-3">
                  {shippingRates.map((rate) => (
                    <label key={rate.id} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedRate?.id === rate.id ? 'border-neutral-950 bg-neutral-50' : 'border-neutral-100 hover:border-neutral-300'}`}>
                      <div className="flex items-center gap-4">
                        <input type="radio" checked={selectedRate?.id === rate.id} onChange={() => setSelectedRate(rate)} className="accent-black w-4 h-4" />
                        <div>
                          <p className="text-[11px] font-black uppercase text-neutral-900 tracking-tight">{rate.carrier_name}</p>
                          <p className="text-[10px] text-neutral-500 uppercase">{rate.service_name} • {rate.delivery_time}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-neutral-900">₦{rate.amount.toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-neutral-200 rounded-2xl text-center bg-neutral-50/50">
                  <p className="text-xs text-neutral-400 font-medium">Please enter your address to see shipping options.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setIsProcessing(true);
                initializePayment({ onSuccess: handlePaymentSuccess, onClose: () => setIsProcessing(false) });
              }}
              disabled={!selectedRate || !formData.email || isProcessing}
              className="w-full bg-neutral-900 text-white py-6 rounded-xl text-xs font-bold uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale mt-4"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
              {isProcessing ? "Processing..." : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(finalTotal)}`}
            </button>
            <div className="flex items-center justify-center gap-2 text-neutral-400 text-[10px] uppercase font-bold tracking-widest">
              <ShieldCheck size={14} /> Secure Checkout by Paystack
            </div>
          </section>
        </div>

        {/* RIGHT: SUMMARY SECTION */}
        <div className="lg:col-span-5 mt-10 lg:mt-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white border border-neutral-100 p-8 rounded-3xl shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 mb-8 border-b border-neutral-50 pb-4">Order Summary</h2>
              
              <div className="space-y-6 mb-8 overflow-y-auto max-h-[300px] pr-2">
                {cart.map((item) => (
                  <div key={`${item._id}-${item.size}`} className="flex gap-4 items-center">
                    <div className="relative w-16 h-20 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-neutral-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase text-neutral-900 truncate tracking-tight">{item.name}</h4>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">Size: {item.size} • Qty: {item.quantity}</p>
                      <p className="text-xs font-bold text-neutral-900 mt-1">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.price * item.quantity * (exchangeRates[currency] || 1))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* DISCOUNT */}
              <div className="py-6 border-y border-neutral-50 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="DISCOUNT CODE" 
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest focus:border-black outline-none transition-all"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  />
                  <button onClick={handleApplyDiscount} disabled={isApplying} className="bg-neutral-900 text-white px-5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all">
                    {isApplying ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Discount Applied Successfully</span>
                  </div>
                )}
                {discountError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{discountError}</p>}
              </div>

              {/* TOTALS */}
              <div className="pt-6 space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase text-neutral-500 tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-neutral-900 font-black">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(convertedSubtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase text-neutral-500 tracking-widest">
                  <span>Shipping</span>
                  <span className="text-neutral-900 font-black">
                    {selectedRate ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(convertedShipping)}` : "—"}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs font-bold uppercase text-green-600 tracking-widest">
                    <span>Discount</span>
                    <span className="font-black">-{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-6 border-t border-neutral-100 mt-2">
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-900">Grand Total</span>
                  <span className="text-2xl font-black text-neutral-900 tracking-tight">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(finalTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}