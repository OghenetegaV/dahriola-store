"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { cart, currency, exchangeRates, removeItem } = useStore();
  
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const convertedTotal = subtotal * exchangeRates[currency];

  const formatPrice = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amt);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[80]" />
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[90] shadow-2xl flex flex-col"
          >
            <div className="p-8 flex justify-between items-center border-b border-neutral-100">
              <h2 className="font-display text-3xl lowercase">Your Bag ({cart.length})</h2>
              <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {cart.map((item) => (
                <div key={item._id} className="flex gap-6">
                  <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-neutral-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-[10px] uppercase tracking-widest font-bold">{item.name}</h3>
                      <p className="text-[10px] text-neutral-400 mt-1 lowercase">Size: {item.size}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium">{formatPrice(item.price * exchangeRates[currency])}</span>
                      <button onClick={() => removeItem(item._id)} className="text-[9px] uppercase tracking-tighter text-red-400 border-b border-red-100">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-neutral-50 space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Subtotal</span>
                <span className="text-2xl font-display">{formatPrice(convertedTotal)}</span>
              </div>
              <Link 
                href="/checkout" 
                onClick={onClose}
                className="block w-full bg-neutral-900 text-white text-center py-6 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-brand-beryl transition-all"
              >
                Proceed to Checkout
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}