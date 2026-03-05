"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/src/store/useStore";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { cart, currency, exchangeRates, removeItem, updateQuantity } = useStore();
  
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
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[100] shadow-2xl flex flex-col"
          >
            <div className="p-8 flex justify-between items-center border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} strokeWidth={1.5} />
                <h2 className="font-display text-3xl lowercase">Your Bag ({cart.length})</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Your bag is currently empty</p>
                  <button onClick={onClose} className="text-[10px] uppercase tracking-widest font-bold text-brand-beryl border-b border-brand-beryl/20 pb-1">Continue Browsing</button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item._id}-${item.size}`} className="flex gap-6 group">
                    <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-900">{item.name}</h3>
                          <button 
                            onClick={() => removeItem(item._id, item.size)} 
                            className="text-neutral-300 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-400 lowercase italic">Size: {item.size}</p>
                        {item.notes && (
                          <p className="text-[9px] text-brand-beryl line-clamp-1 italic">Note: {item.notes}</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center border border-neutral-100 rounded-lg h-8 bg-neutral-50/50">
                          <button 
                            onClick={() => updateQuantity(item._id, item.size, item.quantity - 1)}
                            className="px-2 h-full hover:text-brand-beryl transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-8 text-center text-[10px] font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                            className="px-2 h-full hover:text-brand-beryl transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="text-sm font-medium text-neutral-900">
                          {formatPrice(item.price * item.quantity * exchangeRates[currency])}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-neutral-50/80 border-t border-neutral-100 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-neutral-400">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Estimated Subtotal</span>
                    <span className="text-sm line-through opacity-50">{formatPrice(subtotal * exchangeRates[currency])}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-900 font-bold">Final Amount</span>
                    <span className="text-3xl font-display text-brand-beryl">{formatPrice(convertedTotal)}</span>
                  </div>
                </div>

                <Link 
                  href="/checkout" 
                  onClick={onClose}
                  className="group relative flex items-center justify-center w-full bg-neutral-900 text-white py-6 rounded-full overflow-hidden transition-all hover:bg-brand-beryl"
                >
                  <span className="relative z-10 text-[10px] uppercase tracking-[0.4em] font-bold flex items-center gap-2">
                    Proceed to Checkout <Plus size={12} className="group-hover:rotate-45 transition-transform" />
                  </span>
                </Link>
                
                <p className="text-[9px] text-center text-neutral-400 uppercase tracking-widest leading-loose">
                  Shipping & taxes calculated at checkout
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}