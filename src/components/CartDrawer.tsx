"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/src/store/useStore";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { cart, currency, exchangeRates, removeItem, updateQuantity } = useStore();
  
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const convertedTotal = subtotal * exchangeRates[currency];

  const formatPrice = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP: Increased Z-Index to overlap everything */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-[200]" 
          />
          
          {/* DRAWER: Set to top-0 and z-[210] to ensure it covers AnnouncementBar */}
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 35, stiffness: 350 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[210] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col"
          >
            {/* HEADER */}
            <div className="px-6 py-6 flex justify-between items-center border-b border-neutral-50">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} strokeWidth={1.5} className="text-brand-beryl" />
                <h2 className="font-display text-2xl  tracking-tight">
                  Your Bag <span className="text-neutral-300 ml-1">({cart.length})</span>
                </h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-full transition-colors">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center">
                    <ShoppingBag size={24} className="text-neutral-100" strokeWidth={1} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Your bag is empty</p>
                    <button onClick={onClose} className="text-[11px] text-brand-beryl font-medium hover:opacity-70 transition-opacity">
                      start shopping →
                    </button>
                  </div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item._id}-${item.size}`} className="flex gap-4 group pb-6 border-b border-neutral-50/50 last:border-0">
                    <div className="relative w-20 h-28 rounded-lg overflow-hidden bg-neutral-50 shrink-0 border border-neutral-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-[10px] uppercase tracking-wider font-bold text-neutral-800 line-clamp-1">{item.name}</h3>
                          <button 
                            onClick={() => removeItem(item._id, item.size)} 
                            className="text-neutral-300 hover:text-red-400 transition-colors shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-[9px] text-neutral-400 uppercase tracking-tighter">Size: <span className="text-neutral-900 font-bold">{item.size}</span></p>
                        {item.notes && (
                          <p className="text-[9px] text-brand-beryl italic opacity-80 leading-tight line-clamp-2">"{item.notes}"</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center border border-neutral-100 rounded-full h-7 px-1 bg-neutral-50/30">
                          <button 
                            onClick={() => updateQuantity(item._id, item.size, item.quantity - 1)}
                            className="w-6 h-full flex items-center justify-center hover:text-brand-beryl transition-colors"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-[10px] font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item._id, item.size, item.quantity + 1)}
                            className="w-6 h-full flex items-center justify-center hover:text-brand-beryl transition-colors"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <span className="text-[12px] font-bold text-neutral-900">
                          {formatPrice(item.price * item.quantity * exchangeRates[currency])}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* FOOTER */}
            {cart.length > 0 && (
              <div className="px-6 py-8 bg-white border-t border-neutral-100 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-neutral-400">
                    <span className="text-[9px] uppercase tracking-widest font-bold">Subtotal</span>
                    <span className="text-xs font-medium">{formatPrice(subtotal * exchangeRates[currency])}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-neutral-50">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-900 font-black">Total Due</span>
                    <span className="text-3xl font-display text-neutral-950 tracking-tighter">{formatPrice(convertedTotal)}</span>
                  </div>
                </div>

                <Link 
                  href="/checkout" 
                  onClick={onClose}
                  className="group relative flex items-center justify-center w-full bg-neutral-950 text-white py-5 rounded-full overflow-hidden transition-all active:scale-[0.98] hover:bg-neutral-800"
                >
                  <span className="relative z-10 text-[10px] uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                    Proceed to Checkout <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                
                <p className="text-[8px] text-center text-neutral-400 uppercase tracking-widest leading-loose">
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