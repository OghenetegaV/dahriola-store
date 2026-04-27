"use server";

type DeliveryData = {
  city: string;
  state: string;
  country?: string;
  line1: string;
  postalCode?: string;
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

function cleanText(value?: string) {
  return (value || "").trim();
}

function normalizeCountry(country?: string) {
  const value = cleanText(country).toLowerCase();

  const countryMap: Record<string, string> = {
    nigeria: "NG",
    ng: "NG",
    "united states": "US",
    usa: "US",
    us: "US",
    "united kingdom": "GB",
    uk: "GB",
    gb: "GB",
    canada: "CA",
    ca: "CA",
    ghana: "GH",
    gh: "GH",
    kenya: "KE",
    ke: "KE",
    "south africa": "ZA",
    za: "ZA",
    france: "FR",
    germany: "DE",
    italy: "IT",
    spain: "ES",
    netherlands: "NL",
    australia: "AU",
    singapore: "SG",
    uae: "AE",
    "united arab emirates": "AE",
  };

  return countryMap[value] || value.toUpperCase() || "NG";
}

function getBackupRates(deliveryData: DeliveryData): NormalizedRate[] {
  const state = cleanText(deliveryData.state).toLowerCase();
  const city = cleanText(deliveryData.city).toLowerCase();
  const country = normalizeCountry(deliveryData.country);

  if (country === "NG") {
    const isLagos = state === "lagos";
    const isLagosMainland = [
      "ikeja",
      "yaba",
      "surulere",
      "maryland",
      "gbagada",
      "oshodi",
      "mushin",
      "ogba",
      "agege",
    ].includes(city);

    const isLagosIsland = [
      "lekki",
      "victoria island",
      "vi",
      "ikoyi",
      "ajah",
      "banana island",
    ].includes(city);

    const isFarLagos = ["ikorodu", "epe", "badagry"].includes(city);

    let standard = 5000;
    let express = 8000;
    let standardTime = "4-7 Business Days";
    let expressTime = "2-4 Business Days";

    if (isLagos) {
      if (isLagosIsland) {
        standard = 3000;
        express = 5000;
      } else if (isLagosMainland) {
        standard = 3500;
        express = 5500;
      } else if (isFarLagos) {
        standard = 4500;
        express = 7000;
      } else {
        standard = 4000;
        express = 6500;
      }

      standardTime = "2-4 Business Days";
      expressTime = "1-2 Business Days";
    }

    return [
      {
        id: "backup-ng-standard",
        rate_id: "backup-ng-standard",
        carrier_name: "Dahriola Local Delivery",
        service_name: "Standard Delivery",
        delivery_time: standardTime,
        amount: standard,
        currency: "NGN",
        source: "backup",
      },
      {
        id: "backup-ng-express",
        rate_id: "backup-ng-express",
        carrier_name: "Dahriola Local Delivery",
        service_name: "Express Delivery",
        delivery_time: expressTime,
        amount: express,
        currency: "NGN",
        source: "backup",
      },
    ];
  }

  const westAfrica = ["GH", "BJ", "TG", "CI", "SN", "CM"];
  const africa = ["KE", "ZA", "UG", "TZ", "RW", "EG", "MA"];
  const europe = ["GB", "FR", "DE", "IT", "ES", "NL", "BE", "IE"];
  const northAmerica = ["US", "CA"];
  const middleEast = ["AE", "SA", "QA"];
  const asiaPacific = ["AU", "CN", "JP", "SG", "MY"];

  let amount = 85000;
  let deliveryTime = "7-14 Business Days";

  if (westAfrica.includes(country)) {
    amount = 35000;
    deliveryTime = "5-10 Business Days";
  } else if (africa.includes(country)) {
    amount = 50000;
    deliveryTime = "7-12 Business Days";
  } else if (europe.includes(country)) {
    amount = 75000;
    deliveryTime = "7-14 Business Days";
  } else if (northAmerica.includes(country)) {
    amount = 90000;
    deliveryTime = "8-15 Business Days";
  } else if (middleEast.includes(country)) {
    amount = 80000;
    deliveryTime = "7-14 Business Days";
  } else if (asiaPacific.includes(country)) {
    amount = 95000;
    deliveryTime = "10-18 Business Days";
  }

  return [
    {
      id: "backup-intl-standard",
      rate_id: "backup-intl-standard",
      carrier_name: "International Shipping",
      service_name: "Standard International Delivery",
      delivery_time: deliveryTime,
      amount,
      currency: "NGN",
      source: "backup",
    },
    {
      id: "backup-intl-priority",
      rate_id: "backup-intl-priority",
      carrier_name: "International Shipping",
      service_name: "Priority International Delivery",
      delivery_time: "5-10 Business Days",
      amount: Math.round(amount * 1.45),
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

  if (!city || !line1) {
    console.error("Missing shipping input:", {
      city,
      state,
      line1,
      country,
    });

    return backupRates;
  }

  const apiKey = process.env.TERMINAL_AFRICA_SECRET_KEY?.trim();

  const baseUrl =
    process.env.TERMINAL_AFRICA_URL?.trim() ||
    "https://api.terminal.africa/v1";

  if (!apiKey) {
    console.error("Terminal Africa API key missing. Using backup rates.");
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
      items: [
        {
          description: "Fashion apparel",
          name: "Fashion apparel",
          currency: "NGN",
          value: 50000,
          quantity: 1,
          weight: 1.5,
          weight_unit: "kg",
        },
      ],
    },

    currency: "NGN",
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${baseUrl}/rates/shipment/quotes`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    clearTimeout(timeoutId);

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
    if (error?.name === "AbortError") {
      console.error(
        "Terminal Africa timed out after 8 seconds. Using backup rates."
      );
    } else {
      logTerminalError("Terminal Africa shipping action failed:", {
        name: error?.name,
        message: error?.message,
        cause: error?.cause,
      });
    }

    return backupRates;
  }
}