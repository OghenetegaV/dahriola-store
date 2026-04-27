"use server";

type DeliveryData = {
  city: string;
  state: string;
  country: string;
  line1: string;
};

type TerminalRate = {
  id?: string;
  rate_id?: string;
  carrier_name?: string;
  service_name?: string;
  carrier_rate_description?: string;
  delivery_time?: string;
  delivery_date?: string;
  amount?: number;
  currency?: string;
};

export async function getShippingRates(deliveryData: DeliveryData) {
  const backupRates = [
    {
      id: "dahriola-std",
      carrier_name: "Standard",
      service_name: "Standard Delivery",
      delivery_time: "3-5 Business Days",
      amount: deliveryData.state?.toLowerCase() === "lagos" ? 2500 : 5000,
      currency: "NGN",
      source: "backup",
    },
    {
      id: "dahriola-exp",
      carrier_name: "Express",
      service_name: "Priority Shipping",
      delivery_time: "1-2 Business Days",
      amount: deliveryData.state?.toLowerCase() === "lagos" ? 4500 : 8000,
      currency: "NGN",
      source: "backup",
    },
  ];

  try {
    const apiKey = process.env.TERMINAL_AFRICA_SECRET_KEY?.trim();

    const baseUrl =
      process.env.TERMINAL_AFRICA_URL?.trim() ||
      "https://api.terminal.africa/v1";

    if (!apiKey) {
      console.error("Terminal Africa API key missing.");
      return backupRates;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${baseUrl}/rates/shipment/quotes`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
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
        currency: "NGN",
      }),
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();

    let data: any = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      console.error("Terminal Africa returned non-JSON response:", rawText);
      return backupRates;
    }

    if (!response.ok) {
      console.error("Terminal Africa API error:", {
        status: response.status,
        response: data,
      });

      return backupRates;
    }

    const terminalRates: TerminalRate[] = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.data?.rates)
      ? data.data.rates
      : Array.isArray(data?.rates)
      ? data.rates
      : [];

    if (!terminalRates.length) {
      console.error("Terminal Africa returned no rates:", data);
      return backupRates;
    }

    const normalizedRates = terminalRates
      .filter((rate) => typeof rate.amount === "number")
      .map((rate, index) => ({
        id: rate.id || rate.rate_id || `terminal-rate-${index}`,
        rate_id: rate.rate_id || rate.id || `terminal-rate-${index}`,
        carrier_name: rate.carrier_name || "Terminal Africa",
        service_name:
          rate.service_name ||
          rate.carrier_rate_description ||
          "Delivery",
        delivery_time:
          rate.delivery_time ||
          rate.delivery_date ||
          "Estimated at checkout",
        amount: Number(rate.amount),
        currency: rate.currency || "NGN",
        source: "terminal-africa",
      }))
      .sort((a, b) => a.amount - b.amount);

    return normalizedRates.length ? normalizedRates : backupRates;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error("Terminal Africa request timed out.");
    } else {
      console.error("Terminal Africa shipping action failed:", error?.message);
    }

    return backupRates;
  }
}