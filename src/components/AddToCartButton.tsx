"use client";

import { useStore } from "@/src/store/useStore";
import { ArrowRight, Check, Plus, Minus } from "lucide-react";
import { urlFor } from "@/src/lib/sanity";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AddToCartButtonProps = {
  product: any;
  selectedSize: string;
  selectedPrint?: any;
};

export default function AddToCartButton({
  product,
  selectedSize,
  selectedPrint,
}: AddToCartButtonProps) {
  const addItem = useStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    if (!selectedSize) return;

    const printNote = selectedPrint?.name
      ? `Print: ${selectedPrint.name}`
      : "";

    const finalNotes = [printNote, notes.trim()]
      .filter(Boolean)
      .join(" | ");

    addItem({
      _id: product._id,
      name: product.name,
      price: product.priceNGN,
      image: product.images?.[0] ? urlFor(product.images[0]).url() : "",
      quantity,
      size: selectedSize,
      notes: finalNotes,
      selectedPrintId: selectedPrint?._id || selectedPrint?.id,
      selectedPrintName: selectedPrint?.name || "",
    });

    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
      setQuantity(1);
      setNotes("");
    }, 3000);
  };

  return (
    <div className="space-y-8">
      {/* Quantity */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-4 block">
          Quantity
        </span>

        <div className="flex items-center h-12 w-36 border border-neutral-200 bg-white rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex-1 h-full flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-900"
          >
            <Minus size={14} />
          </button>

          <span className="w-12 text-center text-sm font-medium border-x border-neutral-200">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex-1 h-full flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-900"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Selected Print */}
      {selectedPrint?.name && (
        <div className="rounded-md border border-brand-beryl/20 bg-brand-beryl/5 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-beryl font-bold">
            Selected Print
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            {selectedPrint.name}
          </p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-4 block">
          Custom Adjustments / Notes (Optional)
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Please shorten the sleeves by 1 inch..."
          className="w-full bg-[#fafafa] border border-neutral-200 rounded-md p-4 text-sm font-light focus:border-brand-beryl outline-none transition-all min-h-[100px] resize-none placeholder:text-neutral-300"
        />
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAdded}
        className={`group relative w-full overflow-hidden h-[56px] px-8 rounded-full transition-all duration-500 cursor-pointer ${
          isAdded ? "bg-neutral-900" : "bg-brand-beryl hover:opacity-95"
        }`}
      >
        <AnimatePresence mode="wait">
          {isAdded ? (
            <motion.span
              key="added"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="relative z-10 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] font-bold text-white"
            >
              Added {quantity} × {selectedSize} <Check size={14} />
            </motion.span>
          ) : (
            <motion.span
              key="add"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="relative z-10 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.3em] font-bold text-white"
            >
              Add to Bag{" "}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}