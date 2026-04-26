"use server";

export async function getShippingRates(deliveryData: {
  city: string;
  state: string;
  country: string;
  line1: string;
}) {
  // --- MANUAL BACKUP RATES ---
  // These act as a safety net if the API times out or fails
  const backupRates = [
    {
      id: "dahriola-std",
      carrier_name: "Standard",
      service_name: "Standard Delivery",
      delivery_time: "3-5 Business Days",
      amount: deliveryData.state.toLowerCase() === "lagos" ? 2500 : 5000,
    },
    {
      id: "dahriola-exp",
      carrier_name: "Express",
      service_name: "Priority Shipping",
      delivery_time: "1-2 Business Days",
      amount: deliveryData.state.toLowerCase() === "lagos" ? 4500 : 8000,
    }
  ];

  try {
    const baseUrl = "https://sandbox.api.terminal.africa/v1"; 
    const apiKey = process.env.TERMINAL_AFRICA_SECRET_KEY?.trim();

    if (!apiKey) {
      console.warn("DEBUG: Terminal Africa API Key missing. Using Dahriola backup rates.");
      return backupRates;
    }

    // Set a 5-second timeout so the user isn't waiting indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/rates/shipment/quotes`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
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
          country: "NG",
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

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DEBUG: Terminal Africa API Error. Switching to backups.", errorText);
      return backupRates;
    }

    const data = await response.json();
    
    // Check if the API returned actual rates
    if (!data.data || data.data.length === 0) {
      return backupRates;
    }

    // Return the sorted API rates
    return data.data.sort((a: any, b: any) => a.amount - b.amount);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("DEBUG: Shipping API timed out. Falling back to Dahriola manual rates.");
    } else {
      console.error("DEBUG: Shipping Action Failure:", error.message);
    }
    return backupRates;
  }
}