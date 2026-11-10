"use server";

// Confirms a Paystack transaction with Paystack's own API (the site charges
// through Paystack — this previously asked Flutterwave, so every order was
// marked unverified).
export type PaystackVerification = {
  success: boolean;
  /** false only when Paystack couldn't be reached at all (network/outage) */
  reachable: boolean;
  status?: string;
  amountKobo?: number;
  currency?: string;
  paidAt?: string;
  customerEmail?: string;
  message?: string;
};

export async function verifyPayment(reference: string): Promise<PaystackVerification> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { success: false, reachable: false, message: "PAYSTACK_SECRET_KEY is not set" };
  if (!reference) return { success: false, reachable: true, message: "Missing payment reference" };

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" }
    );
    // Outages and a wrong/expired secret key mean "couldn't check", not "not paid":
    // the order is still recorded, flagged for review.
    if (res.status >= 500 || res.status === 401 || res.status === 403) {
      return { success: false, reachable: false, message: `Paystack returned ${res.status}` };
    }
    const data = await res.json();
    const tx = data?.data;
    return {
      success: data?.status === true && tx?.status === "success",
      reachable: true,
      status: tx?.status,
      amountKobo: Number(tx?.amount || 0),
      currency: tx?.currency,
      paidAt: tx?.paid_at,
      customerEmail: tx?.customer?.email,
      message: data?.message,
    };
  } catch (error) {
    console.error("Paystack verification error:", error);
    return { success: false, reachable: false, message: "Could not reach Paystack" };
  }
}
