"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/src/store/useStore";
import Image from "next/image";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { Loader2, Truck, ShieldCheck, CreditCard } from "lucide-react";

export default function CheckoutPage() {
  const { cart, currency, exchangeRates } = useStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);

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

  // 1. Calculate Subtotal
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const convertedSubtotal = subtotal * exchangeRates[currency];
  
  // 2. Fetch Terminal Africa Rates
  const fetchRates = async () => {
    if (!formData.city || !formData.state) return;
    
    setLoadingRates(true);
    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        body: JSON.stringify({
          city: formData.city,
          state: formData.state,
          items: cart,
        }),
      });
      const data = await response.json();
      setShippingRates(data.rates || []);
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setLoadingRates(false);
    }
  };

  // 3. Final Total Calculation
  const shippingCost = selectedRate ? selectedRate.amount : 0;
  const finalTotal = convertedSubtotal + (shippingCost * (currency === "NGN" ? 1 : exchangeRates[currency]));

  // 4. Flutterwave Config
  const fwConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_KEY!,
    tx_ref: Date.now().toString(),
    amount: finalTotal,
    currency: currency,
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: formData.email,
      phone_number: formData.phone,
      name: formData.name,
    },
    customizations: {
      title: "Dahriola Studio",
      description: "Order Payment",
      logo: "https://your-logo-url.com/logo.png",
    },
  };

  const handleFlutterPayment = useFlutterwave(fwConfig);

  if (!hasHydrated) return null;

  return (
    <div className="bg-white min-h-screen pt-12 pb-20 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* LEFT: Shipping Form (7 Columns) */}
        <div className="lg:col-span-7 space-y-12">
          <section>
            <h2 className="font-display text-4xl lowercase tracking-tighter mb-10">delivery info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="text" placeholder="full name" 
                className="checkout-input"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input 
                type="email" placeholder="email" 
                className="checkout-input"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                type="tel" placeholder="phone number" 
                className="checkout-input"
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <input 
                type="text" placeholder="street address" 
                className="checkout-input"
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
              <input 
                type="text" placeholder="city" 
                className="checkout-input"
                onBlur={fetchRates}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
              <input 
                type="text" placeholder="state" 
                className="checkout-input"
                onBlur={fetchRates}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
              />
            </div>
          </section>

          {/* Terminal Africa Rates Display */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 mb-6">shipping options</h3>
            {loadingRates ? (
              <div className="flex items-center gap-3 text-sm text-neutral-500 italic">
                <Loader2 className="animate-spin" size={16} /> Fetching best rates from carriers...
              </div>
            ) : shippingRates.length > 0 ? (
              <div className="space-y-3">
                {shippingRates.map((rate) => (
                  <label 
                    key={rate.id}
                    className={`flex items-center justify-between p-5 border cursor-pointer rounded-xl transition-all ${selectedRate?.id === rate.id ? 'border-brand-beryl bg-neutral-50 shadow-sm' : 'border-neutral-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <input type="radio" name="rate" className="accent-brand-beryl" onChange={() => setSelectedRate(rate)} />
                      <span className="text-xs font-bold uppercase tracking-widest">{rate.carrier_name} ({rate.service_name})</span>
                    </div>
                    <span className="text-sm font-medium">₦{rate.amount.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-neutral-400 italic">Enter city and state to see shipping options.</p>
            )}
          </section>

          <button
            onClick={() => handleFlutterPayment({
              callback: (response) => {
                console.log(response);
                closePaymentModal();
              },
              onClose: () => {},
            })}
            disabled={!selectedRate || !formData.email}
            className="w-full bg-neutral-900 text-white py-7 rounded-full text-[11px] uppercase tracking-[0.4em] font-bold hover:bg-brand-beryl transition-all disabled:opacity-30 flex items-center justify-center gap-3"
          >
            <CreditCard size={16} /> Pay {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(finalTotal)}
          </button>
        </div>

        {/* RIGHT: Summary (5 Columns) */}
        <div className="lg:col-span-5">
          <div className="bg-neutral-50 p-10 rounded-[2.5rem] sticky top-32">
            <h2 className="font-display text-2xl mb-8">Order Summary</h2>
            <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={`${item._id}-${item.size}`} className="flex gap-4">
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-white">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">{item.name}</h4>
                    <p className="text-[9px] text-neutral-400 mt-1 uppercase">Size: {item.size} / Qty: {item.quantity}</p>
                    {item.notes && <p className="text-[9px] text-brand-beryl italic mt-1 line-clamp-1">Note: {item.notes}</p>}
                  </div>
                  <span className="text-xs font-medium self-center">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.price * item.quantity * exchangeRates[currency])}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-6 space-y-4">
              <div className="flex justify-between text-xs uppercase tracking-widest text-neutral-500">
                <span>Subtotal</span>
                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(convertedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-xs uppercase tracking-widest text-neutral-500">
                <span>Shipping</span>
                <span>{selectedRate ? `₦${selectedRate.amount.toLocaleString()}` : "—"}</span>
              </div>
              <div className="flex justify-between text-xl font-display pt-6 border-t border-neutral-200">
                <span>Total</span>
                <span className="text-brand-beryl">{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}