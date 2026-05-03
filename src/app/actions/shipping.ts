"use server";

type DeliveryData = {
  city: string;
  state: string;
  country?: string;
  line1: string;
  postalCode?: string;
};

type RateSource = "terminal-africa" | "local-rider" | "backup";

type NormalizedRate = {
  id: string;
  rate_id: string;
  carrier_name: string;
  service_name: string;
  delivery_time: string;
  amount: number;
  currency: string;
  source: RateSource;
  carrier_logo?: string;
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
  carrier_logo?: string;
};

function cleanText(value?: string) {
  return (value || "").trim();
}

function normalizeText(value?: string) {
  return cleanText(value).toLowerCase();
}

function normalizeCountry(country?: string) {
  const rawValue = cleanText(country);

  if (/^[A-Za-z]{2}$/.test(rawValue)) {
    return rawValue.toUpperCase();
  }

  const value = rawValue.toLowerCase();

  const countryMap: Record<string, string> = {
    nigeria: "NG",
    ng: "NG",

    "united states": "US",
    "united states of america": "US",
    usa: "US",
    us: "US",

    "united kingdom": "GB",
    uk: "GB",
    gb: "GB",
    england: "GB",

    canada: "CA",
    ca: "CA",

    ghana: "GH",
    gh: "GH",

    kenya: "KE",
    ke: "KE",

    "south africa": "ZA",
    za: "ZA",

    france: "FR",
    fr: "FR",

    germany: "DE",
    de: "DE",

    italy: "IT",
    it: "IT",

    spain: "ES",
    es: "ES",

    netherlands: "NL",
    nl: "NL",

    australia: "AU",
    au: "AU",

    singapore: "SG",
    sg: "SG",

    uae: "AE",
    "united arab emirates": "AE",
    ae: "AE",
  };

  return countryMap[value] || value.toUpperCase() || "NG";
}

function isIbadanOrOyo(deliveryData: DeliveryData) {
  const city = normalizeText(deliveryData.city);
  const state = normalizeText(deliveryData.state);

  return city.includes("ibadan") || state.includes("oyo");
}

function isLagos(deliveryData: DeliveryData) {
  const state = normalizeText(deliveryData.state);
  const city = normalizeText(deliveryData.city);

  return (
    state.includes("lagos") ||
    [
      "ikeja",
      "yaba",
      "surulere",
      "lekki",
      "ajah",
      "ikoyi",
      "victoria island",
      "vi",
      "maryland",
      "gbagada",
      "ikorodu",
      "epe",
      "badagry",
      "oshodi",
      "mushin",
      "ogba",
      "agege",
    ].includes(city)
  );
}

function getLocalRiderRates(deliveryData: DeliveryData): NormalizedRate[] {
  const country = normalizeCountry(deliveryData.country);

  if (country !== "NG") return [];

  if (isIbadanOrOyo(deliveryData)) {
    return [
      {
        id: "dahriola-rider-ibadan-standard",
        rate_id: "dahriola-rider-ibadan-standard",
        carrier_name: "Dahriola Local Rider",
        service_name: "Ibadan Local Delivery",
        delivery_time: "Same day / Next day",
        amount: 10,
        currency: "NGN",
        source: "local-rider",
      },
      {
        id: "dahriola-rider-ibadan-express",
        rate_id: "dahriola-rider-ibadan-express",
        carrier_name: "Dahriola Local Rider",
        service_name: "Ibadan Express Delivery",
        delivery_time: "Same day where available",
        amount: 3500,
        currency: "NGN",
        source: "local-rider",
      },
    ];
  }

  if (isLagos(deliveryData)) {
    return [
      {
        id: "dahriola-rider-lagos-standard",
        rate_id: "dahriola-rider-lagos-standard",
        carrier_name: "Dahriola Local Rider",
        service_name: "Lagos Local Delivery",
        delivery_time: "1-2 Business Days",
        amount: 4000,
        currency: "NGN",
        source: "local-rider",
      },
      {
        id: "dahriola-rider-lagos-express",
        rate_id: "dahriola-rider-lagos-express",
        carrier_name: "Dahriola Local Rider",
        service_name: "Lagos Express Delivery",
        delivery_time: "Same day / Next day",
        amount: 6500,
        currency: "NGN",
        source: "local-rider",
      },
    ];
  }

  return [];
}

function getBackupRates(deliveryData: DeliveryData): NormalizedRate[] {
  const country = normalizeCountry(deliveryData.country);

  if (country === "NG") {
    return [
      {
        id: "backup-ng-standard",
        rate_id: "backup-ng-standard",
        carrier_name: "Nationwide Delivery Estimate",
        service_name: "Standard Delivery Estimate",
        delivery_time: "3-7 Business Days",
        amount: 6000,
        currency: "NGN",
        source: "backup",
      },
      {
        id: "backup-ng-express",
        rate_id: "backup-ng-express",
        carrier_name: "Nationwide Delivery Estimate",
        service_name: "Express Delivery Estimate",
        delivery_time: "2-4 Business Days",
        amount: 9000,
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
      carrier_name: "International Courier Estimate",
      service_name: "Standard International Delivery Estimate",
      delivery_time: deliveryTime,
      amount,
      currency: "NGN",
      source: "backup",
    },
    {
      id: "backup-intl-priority",
      rate_id: "backup-intl-priority",
      carrier_name: "International Courier Estimate",
      service_name: "Priority International Delivery Estimate",
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

function extractTerminalRates(data: any): TerminalRate[] {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.rates)) return data.data.rates;
  if (Array.isArray(data?.rates)) return data.rates;
  if (Array.isArray(data?.data?.quotes)) return data.data.quotes;
  if (Array.isArray(data?.quotes)) return data.quotes;

  return [];
}

function normalizeTerminalRates(terminalRates: TerminalRate[]): NormalizedRate[] {
  return terminalRates
    .filter((rate) => Number.isFinite(Number(rate.amount)))
    .map((rate, index) => ({
      id: rate.id || rate.rate_id || `terminal-rate-${index}`,
      rate_id: rate.rate_id || rate.id || `terminal-rate-${index}`,
      carrier_name: rate.carrier_name || "Terminal Africa",
      service_name:
        rate.service_name ||
        rate.carrier_rate_description ||
        "Courier Delivery",
      delivery_time:
        rate.delivery_time ||
        rate.delivery_date ||
        "Estimated at checkout",
      amount: Number(rate.amount),
      currency: rate.currency || "NGN",
      source: "terminal-africa" as const,
      carrier_logo: rate.carrier_logo,
    }))
    .sort((a, b) => a.amount - b.amount);
}

function mergeRates(
  localRates: NormalizedRate[],
  terminalRates: NormalizedRate[],
  backupRates: NormalizedRate[]
): NormalizedRate[] {
  const combined =
    terminalRates.length > 0
      ? [...localRates, ...terminalRates]
      : [...localRates, ...backupRates];

  const seen = new Set<string>();

  return combined.filter((rate) => {
    const key = `${rate.carrier_name}-${rate.service_name}-${rate.amount}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export async function getShippingRates(
  deliveryData: DeliveryData
): Promise<NormalizedRate[]> {
  const localRiderRates = getLocalRiderRates(deliveryData);
  const backupRates = getBackupRates(deliveryData);

  const city = cleanText(deliveryData.city);
  const state = cleanText(deliveryData.state);
  const line1 = cleanText(deliveryData.line1);
  const country = normalizeCountry(deliveryData.country);
  const postalCode = cleanText(deliveryData.postalCode);

  if (!city || !state || !line1 || !country) {
    console.error("Missing shipping input:", {
      city,
      state,
      line1,
      country,
      postalCode,
    });

    return mergeRates(localRiderRates, [], backupRates);
  }

  const apiKey = process.env.TERMINAL_AFRICA_SECRET_KEY?.trim();

  const baseUrl =
    process.env.TERMINAL_AFRICA_URL?.trim() ||
    "https://api.terminal.africa/v1";

  if (!apiKey) {
    console.error("Terminal Africa API key missing. Using local/backup rates.");
    return mergeRates(localRiderRates, [], backupRates);
  }

  const payload = {
    pickup_address: {
      city: process.env.TERMINAL_PICKUP_CITY || "Ibadan",
      state: process.env.TERMINAL_PICKUP_STATE || "Oyo",
      country: "NG",
      line1: process.env.TERMINAL_PICKUP_LINE1 || "Ibadan, Oyo State",
      zip: process.env.TERMINAL_PICKUP_ZIP || "",
    },

    delivery_address: {
      city,
      state,
      country,
      line1,
      zip: postalCode,
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
    const timeoutId = setTimeout(() => controller.abort(), 20000);

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
      return mergeRates(localRiderRates, [], backupRates);
    }

    if (!response.ok || data?.status === false) {
      logTerminalError("Terminal Africa API error:", {
        status: response.status,
        request: payload,
        response: data,
      });

      return mergeRates(localRiderRates, [], backupRates);
    }

    const terminalRates = extractTerminalRates(data);

    if (!terminalRates.length) {
      logTerminalError("Terminal Africa returned no usable rates:", {
        request: payload,
        response: data,
      });

      return mergeRates(localRiderRates, [], backupRates);
    }

    const normalizedTerminalRates = normalizeTerminalRates(terminalRates);

    return mergeRates(localRiderRates, normalizedTerminalRates, backupRates);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error(
        "Terminal Africa timed out after 20 seconds. Using local/backup rates."
      );
    } else {
      logTerminalError("Terminal Africa shipping action failed:", {
        name: error?.name,
        message: error?.message,
        cause: error?.cause,
      });
    }

    return mergeRates(localRiderRates, [], backupRates);
  }
}