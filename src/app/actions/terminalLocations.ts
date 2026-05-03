"use server";

type TerminalCountry = {
  name: string;
  isoCode: string;
  currency?: string;
  flag?: string;
};

type TerminalState = {
  name: string;
  isoCode: string;
  countryCode: string;
};

type TerminalCity = {
  name: string;
  countryCode: string;
  stateCode?: string;
};

function getTerminalConfig() {
  const apiKey = process.env.TERMINAL_AFRICA_SECRET_KEY?.trim();

  const baseUrl =
    process.env.TERMINAL_AFRICA_URL?.trim() ||
    "https://api.terminal.africa/v1";

  if (!apiKey) {
    throw new Error("TERMINAL_AFRICA_SECRET_KEY is missing.");
  }

  return { apiKey, baseUrl };
}

async function terminalGet<T>(path: string): Promise<T[]> {
  const { apiKey, baseUrl } = getTerminalConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "force-cache",
    next: { revalidate: 60 * 60 * 24 },
  });

  const rawText = await response.text();

  let data: any = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    console.error("Terminal location API returned non-JSON:", rawText);
    return [];
  }

  if (!response.ok || data?.status === false) {
    console.error("Terminal location API error:", {
      path,
      status: response.status,
      response: data,
    });

    return [];
  }

  return Array.isArray(data?.data) ? data.data : [];
}

export async function getTerminalCountries() {
  try {
    const countries = await terminalGet<TerminalCountry>("/countries");

    return countries
      .filter((country) => country.name && country.isoCode)
      .map((country) => ({
        name: country.name,
        code: country.isoCode,
        currency: country.currency || "",
        flag: country.flag || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error: any) {
    console.error("Failed to fetch Terminal countries:", error?.message);
    return [];
  }
}

export async function getTerminalStates(countryCode: string) {
  try {
    if (!countryCode) return [];

    const params = new URLSearchParams({
      country_code: countryCode,
    });

    const states = await terminalGet<TerminalState>(
      `/states?${params.toString()}`
    );

    return states
      .filter((state) => state.name && state.isoCode)
      .map((state) => ({
        name: state.name,
        code: state.isoCode,
        countryCode: state.countryCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error: any) {
    console.error("Failed to fetch Terminal states:", error?.message);
    return [];
  }
}

export async function getTerminalCities(countryCode: string, stateCode?: string) {
  try {
    if (!countryCode) return [];

    const params = new URLSearchParams({
      country_code: countryCode,
    });

    if (stateCode) {
      params.set("state_code", stateCode);
    }

    const cities = await terminalGet<TerminalCity>(
      `/cities?${params.toString()}`
    );

    return cities
      .filter((city) => city.name)
      .map((city) => ({
        name: city.name,
        countryCode: city.countryCode,
        stateCode: city.stateCode || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error: any) {
    console.error("Failed to fetch Terminal cities:", error?.message);
    return [];
  }
}