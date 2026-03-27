"use server";

export async function getShippingRates(deliveryData: {
  city: string;
  state: string;
  country: string;
  line1: string;
}) {
  try {
    // Trim and remove any trailing slashes from the base URL
    const baseUrl = process.env.TERMINAL_AFRICA_URL?.trim().replace(/\/+$/, "");
    const apiKey = process.env.TERMINAL_AFRICA_SECRET_KEY?.trim();

    if (!baseUrl || !apiKey) {
      console.error("DEBUG: Environment variables are missing.");
      return [];
    }

    // Explicitly construct the full endpoint
    const fullUrl = `${baseUrl}/rates/shipment/quotes`;
    
    console.log("DEBUG: Sending request to:", fullUrl);

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // We are using a standard Lagos pickup for Dahriola Studio
      body: JSON.stringify({
        pickup_address: {
          city: "Lekki",
          state: "Lagos",
          country: "NG",
          line1: "15 Admiralty Way", 
        },
        delivery_address: {
          city: deliveryData.city,
          state: deliveryData.state,
          country: deliveryData.country || "NG",
          line1: deliveryData.line1,
        },
        parcel: {
          weight: 1.5,
          length: 10,
          width: 10,
          height: 10,
        },
      }),
    });

    // Check if the response is actually JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("DEBUG: Expected JSON but got:", text);
      return [];
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("DEBUG: Terminal Africa Error Response:", data);
      return [];
    }

    return data.data.sort((a: any, b: any) => a.amount - b.amount);
  } catch (error: any) {
    // Detailed logging for the network error you saw
    console.error("DEBUG: Shipping Action Failure:", {
      message: error.message,
      code: error.code,
      hostname: error.hostname
    });
    return [];
  }
}