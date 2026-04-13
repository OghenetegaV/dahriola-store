"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/src/store/useStore";
import Image from "next/image";
import { usePaystackPayment } from "react-paystack"; 
import { Loader2, Truck, CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import { getShippingRates } from "@/src/app/actions/shipping";
import { verifyPayment } from "@/src/app/actions/payment"; 
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, currency, exchangeRates, clearCart } = useStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);

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
        setShippingError("We couldn't find shipping rates for this location.");
      }
    } catch (error) {
      setShippingError("Network error: Unable to reach shipping server.");
    } finally {
      setLoadingRates(false);
    }
  };

  const shippingAmountNGN = selectedRate ? selectedRate.amount : 0;
  const convertedShipping = currency === "NGN" 
    ? shippingAmountNGN 
    : shippingAmountNGN * (exchangeRates[currency] || 1);
    
  const finalTotal = convertedSubtotal + convertedShipping;

  const paystackConfig = {
    reference: `dahriola-${(new Date()).getTime().toString()}`,
    email: formData.email,
    amount: Math.round(finalTotal * 100), 
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    currency: currency,
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
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePaymentSuccess = async (response: any) => {
    setIsProcessing(true);
    try {
      const transactionReference = response.reference || response.trxref;
      const verification = await verifyPayment(transactionReference);

      if (verification.success) {
        clearCart();
        router.push(`/success?reference=${transactionReference}`);
      } else {
        setShippingError("Payment verification failed. Please contact support.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Verification Error:", error);
      setIsProcessing(false);
    }
  };

  const handlePaymentClose = () => {
    setIsProcessing(false);
  };

  if (!hasHydrated) return null;

  return (
    <div className="bg-white min-h-screen pt-20 pb-20 px-4">
      {/* Container switched to flex-col-reverse for mobile, grid for desktop */}
      <div className="max-w-7xl mx-auto flex flex-col-reverse lg:grid lg:grid-cols-12 gap-16">
        
        <div className="lg:col-span-7 space-y-12">
          <section>
            <h2 className="font-display text-4xl lowercase tracking-tighter mb-10">delivery info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="text" placeholder="full name" 
                className="checkout-input border-b border-neutral-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input 
                type="email" placeholder="email" 
                className="checkout-input border-b border-neutral-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                type="tel" placeholder="phone number" 
                className="checkout-input border-b border-neutral-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <input 
                type="text" placeholder="street address" 
                className="checkout-input border-b border-neutral-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.address}
                onBlur={fetchRates}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
              <input 
                type="text" placeholder="city" 
                className="checkout-input border-b border-neutral-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.city}
                onBlur={fetchRates}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
              <input 
                type="text" placeholder="state" 
                className="checkout-input border-b border-neutral-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.state}
                onBlur={fetchRates}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
          </section>

          <section>
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 mb-6 flex items-center gap-2">
              <Truck size={14} /> shipping options
            </h3>
            
            {loadingRates ? (
              <div className="flex items-center gap-3 text-sm text-neutral-500 italic p-6 border border-neutral-100 rounded-xl">
                <Loader2 className="animate-spin text-neutral-400" size={16} /> 
                <span className="tracking-tight">Calculating live delivery rates...</span>
              </div>
            ) : shippingError ? (
              <div className="p-6 border border-red-100 rounded-xl bg-red-50/50 flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-widest">
                  <AlertCircle size={14} /> Error
                </div>
                <p className="text-[11px] text-neutral-600">{shippingError}</p>
                <button onClick={fetchRates} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-900">
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : shippingRates.length > 0 ? (
              <div className="space-y-3">
                {shippingRates.map((rate) => (
                  <label 
                    key={rate.id}
                    className={`flex items-center justify-between p-5 border cursor-pointer rounded-xl transition-all ${
                      selectedRate?.id === rate.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input 
                        type="radio" name="rate" className="accent-neutral-900" 
                        checked={selectedRate?.id === rate.id}
                        onChange={() => setSelectedRate(rate)} 
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-900">{rate.carrier_name}</span>
                        <span className="text-[10px] text-neutral-400 uppercase">{rate.service_name} — {rate.delivery_time}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-neutral-900">₦{rate.amount.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-neutral-100 rounded-xl bg-neutral-50/50 text-center">
                <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] italic">
                  Enter delivery details to reveal shipping options.
                </p>
              </div>
            )}
          </section>

          <button
            onClick={() => {
                setIsProcessing(true);
                initializePayment({ onSuccess: handlePaymentSuccess, onClose: handlePaymentClose });
            }}
            disabled={!selectedRate || !formData.email || loadingRates || isProcessing}
            className="w-full bg-neutral-900 text-white py-7 rounded-full text-[11px] uppercase tracking-[0.4em] font-bold hover:bg-black transition-all disabled:opacity-20 flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <CreditCard size={16} />
            )}
            {isProcessing ? "Verifying Transaction..." : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(finalTotal)}`}
          </button>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-neutral-50 p-10 rounded-[2.5rem] lg:sticky lg:top-32">
            <h2 className="font-display text-2xl mb-8">Order Summary</h2>
            <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div key={`${item._id}-${item.size}`} className="flex gap-4">
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-900">{item.name}</h4>
                    <p className="text-[9px] text-neutral-400 mt-1 uppercase">Size: {item.size} / Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-medium self-center text-neutral-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.price * item.quantity * (exchangeRates[currency] || 1))}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-6 space-y-4">
              <div className="flex justify-between text-xs uppercase tracking-widest text-neutral-500">
                <span>Subtotal</span>
                <span className="text-neutral-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(convertedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-xs uppercase tracking-widest text-neutral-500">
                <span>Shipping</span>
                <span className="text-neutral-900">
                  {selectedRate ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(convertedShipping)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xl font-display pt-6 border-t border-neutral-200 text-neutral-900">
                <span>Total</span>
                <span className="text-neutral-900">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(finalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}