"use client";

import { usePaystackPayment } from "react-paystack";

interface PaystackProps {
  email: string;
  amount: number; // In Naira (we will multiply by 100 for kobo)
  metadata: {
    name: string;
    phone: string;
  };
  onSuccess: (reference: any) => void;
  onClose: () => void;
}

export default function PaystackButton({ email, amount, metadata, onSuccess, onClose }: PaystackProps) {
  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: amount * 100, // Paystack expects amount in Kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
    metadata: metadata
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      onClick={() => initializePayment({ onSuccess, onClose })}
      className="w-full bg-black text-white py-4 uppercase text-[11px] tracking-[0.3em] font-black hover:bg-neutral-800 transition-colors"
    >
      Pay Now {amount.toLocaleString()}
    </button>
  );
}