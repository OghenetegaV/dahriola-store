"use server";

export async function verifyPayment(transactionId: string) {
  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.status === "success" && data.data.status === "successful") {
      // Logic here: Save order to Sanity/Database
      return { success: true, data: data.data };
    }

    return { success: false, message: "Payment verification failed" };
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return { success: false };
  }
}