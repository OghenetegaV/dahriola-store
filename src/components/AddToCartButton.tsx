"use client";

import { useStore } from "@/src/store/useStore";
import { ArrowRight, Check, Plus, Minus } from "lucide-react";
import { urlFor } from "@/src/lib/sanity";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddToCartButton({ product }: { product: any }) {
  const addItem = useStore((state) => state.addItem);
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    addItem({
      _id: product._id,
      name: product.name,
      price: product.priceNGN,
      image: urlFor(product.images[0]).url(),
      quantity: quantity,
      size: selectedSize,
      notes: notes,
    });

    setIsAdded(true);
    // Reset state after adding
    setTimeout(() => {
      setIsAdded(false);
      setQuantity(1);
    }, 3000);
  };

  return (
    <div className="space-y-10">
      {/* 1. Size Selection & Quantity Row */}
      <div className="space-y-8">
        {/* Size Selection */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">
              Select Size
            </span>
            <span className="text-[9px] uppercase tracking-widest text-neutral-300 italic">
              Fits true to size
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-14 h-14 flex items-center justify-center text-[11px] border transition-all duration-300 ${
                  selectedSize === size 
                    ? 'border-neutral-900 bg-neutral-900 text-white font-bold' 
                    : 'border-neutral-100 text-neutral-400 hover:border-neutral-900'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-4 block">
            Quantity
          </span>
          <div className="flex items-center h-14 w-40 border border-neutral-100 bg-neutral-50/30">
            <button 
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="flex-1 h-full flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-900"
            >
              <Minus size={14} />
            </button>
            <span className="w-12 text-center text-sm font-medium border-x border-neutral-100/50">
              {quantity}
            </span>
            <button 
              onClick={() => setQuantity(q => q + 1)}
              className="flex-1 h-full flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-900"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Special Instructions Field */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-150">
        <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-4 block">
          Custom Adjustments / Notes (Optional)
        </label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Please shorten the sleeves by 1 inch..."
          className="w-full bg-neutral-50/50 border-b border-neutral-100 p-5 text-sm font-light focus:border-brand-beryl outline-none transition-all min-h-[100px] resize-none placeholder:text-neutral-300"
        />
      </div>

      {/* 3. Action Button */}
      <button 
        onClick={handleAdd}
        disabled={isAdded}
        className={`group relative w-full overflow-hidden py-7 px-8 transition-all duration-500 cursor-pointer ${
          isAdded ? 'bg-brand-beryl' : 'bg-neutral-900 hover:bg-brand-beryl shadow-lg hover:shadow-brand-beryl/20'
        }`}
      >
        <AnimatePresence mode="wait">
          {isAdded ? (
            <motion.span 
              key="added"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="relative z-10 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.4em] font-bold text-white"
            >
              Added {quantity} x {selectedSize} to Bag <Check size={14} />
            </motion.span>
          ) : (
            <motion.span 
              key="add"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="relative z-10 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.4em] font-bold text-white"
            >
              Add to Bag <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}