"use server";

type DeliveryData = {
  city: string;
  state: string;
  country?: string;
  line1: string;
  postalCode?: string;
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

type NormalizedRate = {
  id: string;
  rate_id: string;
  carrier_name: string;
  service_name: string;
  delivery_time: string;
  amount: number;
  currency: string;
  source: "terminal-africa" | "backup";
};

function cleanText(value?: string) {
  return (value || "").trim();
}

function normalizeCountry(country?: string) {
  const value = cleanText(country).toLowerCase();

  if (!value || value === "nigeria" || value === "ng") return "NG";

  return country?.trim().toUpperCase() || "NG";
}

function getBackupRates(deliveryData: DeliveryData): NormalizedRate[] {
  const isLagos = cleanText(deliveryData.state).toLowerCase() === "lagos";

  return [
    {
      id: "dahriola-std",
      rate_id: "dahriola-std",
      carrier_name: "Standard",
      service_name: "Standard Delivery",
      delivery_time: "3-5 Business Days",
      amount: isLagos ? 2500 : 5000,
      currency: "NGN",
      source: "backup",
    },
    {
      id: "dahriola-exp",
      rate_id: "dahriola-exp",
      carrier_name: "Express",
      service_name: "Priority Shipping",
      delivery_time: "1-2 Business Days",
      amount: isLagos ? 4500 : 8000,
      currency: "NGN",
      source: "backup",
    },
  ];
}

function logTerminalError(label: string, payload: unknown) {
  console.error(label, JSON.stringify(payload, null, 2));
}

export async function getShippingRates(
  deliveryData: DeliveryData
): Promise<NormalizedRate[]> {
  const backupRates = getBackupRates(deliveryData);

  const city = cleanText(deliveryData.city);
  const state = cleanText(deliveryData.state);
  const line1 = cleanText(deliveryData.line1);
  const country = normalizeCountry(deliveryData.country);

  if (!city || !state || !line1) {
    console.error("Missing shipping input:", { city, state, line1, country });
    return backupRates;
  }

  const apiKey = process.env.TERMINAL_AFRICA_SECRET_KEY?.trim();
  const baseUrl =
    process.env.TERMINAL_AFRICA_URL?.trim() ||
    "https://api.terminal.africa/v1";

  if (!apiKey) {
    console.error("Terminal Africa API key missing.");
    return backupRates;
  }

  const payload = {
    pickup_address: {
      city: process.env.TERMINAL_PICKUP_CITY || "Lekki",
      state: process.env.TERMINAL_PICKUP_STATE || "Lagos",
      country: "NG",
      line1: process.env.TERMINAL_PICKUP_LINE1 || "15 Admiralty Way",
      zip: process.env.TERMINAL_PICKUP_ZIP || "",
    },

    delivery_address: {
      city,
      state,
      country,
      line1,
      zip: cleanText(deliveryData.postalCode),
    },

    parcel: {
      description: "Fashion apparel",
      weight: 1.5,
      weight_unit: "kg",
      length: 10,
      width: 10,
      height: 10,

      // Extra fields added for Terminal Africa compatibility.
      // Some accounts/endpoints expect parcel item details.
      items: [
        {
          description: "Fashion apparel",
          name: "Fashion apparel",
          currency: "NGN",
          value: 50000,
          quantity: 1,
          weight: 1.5,
        },
      ],
    },

    currency: "NGN",
  };

  try {
    // const controller = new AbortController();
    // const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${baseUrl}/rates/shipment/quotes`, {
      method: "POST",
      // signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    // clearTimeout(timeoutId);

    const rawText = await response.text();

    let data: any = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      logTerminalError("Terminal Africa returned non-JSON response:", rawText);
      return backupRates;
    }

    if (!response.ok) {
      logTerminalError("Terminal Africa API error:", {
        status: response.status,
        request: payload,
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
      logTerminalError("Terminal Africa returned no usable rates:", {
        request: payload,
        response: data,
      });

      return backupRates;
    }

    const normalizedRates: NormalizedRate[] = terminalRates
      .filter((rate) => Number.isFinite(Number(rate.amount)))
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
    logTerminalError("Terminal Africa shipping action failed:", {
      name: error?.name,
      message: error?.message,
      cause: error?.cause,
    });

    return backupRates;
  }
}