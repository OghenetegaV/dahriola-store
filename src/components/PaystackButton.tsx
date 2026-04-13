"use client";

import { usePaystackPayment } from "react-paystack";

interface PaystackProps {
  email: string;
  amount: number; // In Naira (will be converted to kobo)
  metadata: {
    name: string;
    phone: string;
  };
  onSuccess: (reference: any) => void;
  onClose: () => void;
}

export default function PaystackButton({ email, amount, metadata, onSuccess, onClose }: PaystackProps) {
  const config = {
    reference: `dahriola-${new Date().getTime().toString()}`,
    email: email,
    amount: Math.round(amount * 100), // Ensure it's an integer for Kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
    metadata: {
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: metadata.name,
        },
        {
          display_name: "Phone Number",
          variable_name: "phone_number",
          value: metadata.phone,
        },
      ],
    },
  };

  // @ts-ignore - Ignore type mismatch if React 19 peer dependency warning persists
  const initializePayment = usePaystackPayment(config);

  return (
    <button
      onClick={() => initializePayment({ onSuccess, onClose })}
      className="w-full bg-black text-white py-4 uppercase text-[11px] tracking-[0.3em] font-black hover:bg-neutral-800 transition-colors"
    >
      Pay Now ₦{amount.toLocaleString()}
    </button>
  );
}