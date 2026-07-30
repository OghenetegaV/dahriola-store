// src/data/shippingRates.ts
// ─────────────────────────────────────────────────────────────────────────────
// HARD-CODED DHL SHIPPING FALLBACK  (origin: Nigeria / IBADAN, Oyo State)
//
// Why this exists: Terminal Africa's live-rate API was down. This file feeds the
// checkout country/state dropdowns and generates delivery rates from static
// DHL-modelled tables — no external API call. When Terminal is back, you can
// swap the action imports back; nothing else needs to change.
//
// ⚠️  RATES ARE DHL-ANCHORED (NGN) AND EDITABLE.
//     Domestic tiers are anchored to a REAL invoice: Ibadan → Lagos ≈ ₦7,500
//     (Express, one packaged outfit). Origin is Ibadan, so Oyo is the local
//     tier, Lagos sits in the Southwest neighbour tier, and rates scale up for
//     the South/FCT and the North. International parcels still leave via DHL's
//     Lagos gateway, so zone rates are independent of the Ibadan origin.
//     To adjust, edit ZONE_RATES / DOMESTIC_RATES below — the dropdowns and
//     checkout update automatically.
//
// WEIGHT MODEL: `base` covers DHL's minimum billable bracket (first 0.5 kg),
// then `perHalfKg` is added for every additional 0.5 kg (rounded up). Apparel
// is light but DHL bills a minimum, so a single garment lands in `base`. Note
// couriers also bill volumetric weight (L×W×H ÷ 5000) — if she starts shipping
// bulky multi-item boxes, raise DEFAULT_ITEM_WEIGHT_KG below.
// ─────────────────────────────────────────────────────────────────────────────

export type Country = { code: string; name: string; zone: ZoneId };
export type NigerianState = { code: string; name: string; tier: DomesticTier };

export type RateTier = {
  service: string;        // "DHL Express Worldwide"
  deliveryTime: string;   // human ETA
  base: number;           // NGN, first 0.5 kg
  perHalfKg: number;      // NGN, each additional 0.5 kg
};

export type ComputedRate = {
  id: string;
  service_name: string;
  carrier_name: string;
  delivery_time: string;
  amount: number;         // NGN
};

/* ── International zones ──────────────────────────────────────────────────── */
export type ZoneId =
  | "Z1_WEST_AFRICA" | "Z2_AFRICA" | "Z3_EUROPE_WEST" | "Z4_EUROPE_EAST"
  | "Z5_NORTH_AMERICA" | "Z6_MIDDLE_EAST" | "Z7_ASIA" | "Z8_OCEANIA" | "Z9_LATAM_ROW";

export const ZONE_RATES: Record<ZoneId, RateTier[]> = {
  Z1_WEST_AFRICA: [
    { service: "DHL Express Worldwide", deliveryTime: "1–3 business days", base: 75_000,  perHalfKg: 14_000 },
    { service: "DHL Economy Select",    deliveryTime: "3–5 business days", base: 60_000,  perHalfKg: 11_000 },
  ],
  Z2_AFRICA: [
    { service: "DHL Express Worldwide", deliveryTime: "2–4 business days", base: 95_000,  perHalfKg: 17_000 },
    { service: "DHL Economy Select",    deliveryTime: "4–7 business days", base: 78_000,  perHalfKg: 14_000 },
  ],
  Z3_EUROPE_WEST: [
    { service: "DHL Express Worldwide", deliveryTime: "2–4 business days", base: 150_000, perHalfKg: 28_000 },
    { service: "DHL Economy Select",    deliveryTime: "4–8 business days", base: 120_000, perHalfKg: 22_000 },
  ],
  Z4_EUROPE_EAST: [
    { service: "DHL Express Worldwide", deliveryTime: "3–5 business days", base: 158_000, perHalfKg: 30_000 },
    { service: "DHL Economy Select",    deliveryTime: "5–9 business days", base: 126_000, perHalfKg: 24_000 },
  ],
  Z5_NORTH_AMERICA: [
    { service: "DHL Express Worldwide", deliveryTime: "2–4 business days", base: 175_000, perHalfKg: 32_000 },
    { service: "DHL Economy Select",    deliveryTime: "5–9 business days", base: 140_000, perHalfKg: 26_000 },
  ],
  Z6_MIDDLE_EAST: [
    { service: "DHL Express Worldwide", deliveryTime: "2–4 business days", base: 140_000, perHalfKg: 26_000 },
    { service: "DHL Economy Select",    deliveryTime: "4–7 business days", base: 112_000, perHalfKg: 20_000 },
  ],
  Z7_ASIA: [
    { service: "DHL Express Worldwide", deliveryTime: "3–5 business days", base: 165_000, perHalfKg: 30_000 },
    { service: "DHL Economy Select",    deliveryTime: "6–10 business days", base: 132_000, perHalfKg: 24_000 },
  ],
  Z8_OCEANIA: [
    { service: "DHL Express Worldwide", deliveryTime: "3–6 business days", base: 190_000, perHalfKg: 35_000 },
    { service: "DHL Economy Select",    deliveryTime: "6–11 business days", base: 152_000, perHalfKg: 28_000 },
  ],
  Z9_LATAM_ROW: [
    { service: "DHL Express Worldwide", deliveryTime: "4–7 business days", base: 205_000, perHalfKg: 38_000 },
    { service: "DHL Economy Select",    deliveryTime: "7–12 business days", base: 164_000, perHalfKg: 30_000 },
  ],
};

/* ── Nigeria domestic tiers (origin: Ibadan) ─────────────────────────────── */
// Anchored to a real invoice: Ibadan → Lagos ≈ ₦7,500 (Express, one outfit).
//   T0 = Oyo/Ibadan local (cheapest)
//   T1 = Southwest neighbours incl. LAGOS  ← the ₦7,500 anchor
//   T2 = South & FCT (major cities)
//   T3 = North (furthest)
export type DomesticTier = "T0_OYO_LOCAL" | "T1_SOUTHWEST" | "T2_SOUTH_FCT" | "T3_NORTH";

export const DOMESTIC_RATES: Record<DomesticTier, RateTier[]> = {
  T0_OYO_LOCAL: [
    { service: "DHL Domestic Express",  deliveryTime: "24–48 hours",       base: 5_000, perHalfKg: 900 },
    { service: "DHL Domestic Standard", deliveryTime: "1–3 business days", base: 4000, perHalfKg: 700 },
  ],
  T1_SOUTHWEST: [
    { service: "DHL Domestic Express",  deliveryTime: "1–2 business days", base: 7_500, perHalfKg: 1_300 },
    { service: "DHL Domestic Standard", deliveryTime: "2–4 business days", base: 6_000, perHalfKg: 1_000 },
  ],
  T2_SOUTH_FCT: [
    { service: "DHL Domestic Express",  deliveryTime: "2–3 business days", base: 11_000, perHalfKg: 1_800 },
    { service: "DHL Domestic Standard", deliveryTime: "3–5 business days", base: 9_000,  perHalfKg: 1_500 },
  ],
  T3_NORTH: [
    { service: "DHL Domestic Express",  deliveryTime: "2–4 business days", base: 14_000, perHalfKg: 2_300 },
    { service: "DHL Domestic Standard", deliveryTime: "4–7 business days", base: 11_500, perHalfKg: 1_900 },
  ],
};

/* ── Nigerian states (37 incl. FCT) → domestic tier (Ibadan origin) ───────── */
export const NIGERIAN_STATES: NigerianState[] = [
  { code: "OY", name: "Oyo",          tier: "T0_OYO_LOCAL" },
  { code: "OG", name: "Ogun",         tier: "T1_SOUTHWEST" },
  { code: "OS", name: "Osun",         tier: "T1_SOUTHWEST" },
  { code: "ON", name: "Ondo",         tier: "T1_SOUTHWEST" },
  { code: "EK", name: "Ekiti",        tier: "T1_SOUTHWEST" },
  { code: "LA", name: "Lagos",        tier: "T1_SOUTHWEST" },
  { code: "KW", name: "Kwara",        tier: "T1_SOUTHWEST" },
  { code: "FC", name: "FCT - Abuja",  tier: "T2_SOUTH_FCT" },
  { code: "RI", name: "Rivers",       tier: "T2_SOUTH_FCT" },
  { code: "DE", name: "Delta",        tier: "T2_SOUTH_FCT" },
  { code: "ED", name: "Edo",          tier: "T2_SOUTH_FCT" },
  { code: "AN", name: "Anambra",      tier: "T2_SOUTH_FCT" },
  { code: "EN", name: "Enugu",        tier: "T2_SOUTH_FCT" },
  { code: "AB", name: "Abia",         tier: "T2_SOUTH_FCT" },
  { code: "IM", name: "Imo",          tier: "T2_SOUTH_FCT" },
  { code: "KO", name: "Kogi",         tier: "T2_SOUTH_FCT" },
  { code: "CR", name: "Cross River",  tier: "T2_SOUTH_FCT" },
  { code: "AK", name: "Akwa Ibom",    tier: "T2_SOUTH_FCT" },
  { code: "BY", name: "Bayelsa",      tier: "T2_SOUTH_FCT" },
  { code: "EB", name: "Ebonyi",       tier: "T2_SOUTH_FCT" },
  { code: "KN", name: "Kano",         tier: "T3_NORTH" },
  { code: "KD", name: "Kaduna",       tier: "T3_NORTH" },
  { code: "KT", name: "Katsina",      tier: "T3_NORTH" },
  { code: "SO", name: "Sokoto",       tier: "T3_NORTH" },
  { code: "KE", name: "Kebbi",        tier: "T3_NORTH" },
  { code: "ZA", name: "Zamfara",      tier: "T3_NORTH" },
  { code: "JI", name: "Jigawa",       tier: "T3_NORTH" },
  { code: "BA", name: "Bauchi",       tier: "T3_NORTH" },
  { code: "GO", name: "Gombe",        tier: "T3_NORTH" },
  { code: "YO", name: "Yobe",         tier: "T3_NORTH" },
  { code: "BO", name: "Borno",        tier: "T3_NORTH" },
  { code: "AD", name: "Adamawa",      tier: "T3_NORTH" },
  { code: "TA", name: "Taraba",       tier: "T3_NORTH" },
  { code: "PL", name: "Plateau",      tier: "T3_NORTH" },
  { code: "NA", name: "Nasarawa",     tier: "T3_NORTH" },
  { code: "NI", name: "Niger",        tier: "T3_NORTH" },
  { code: "BE", name: "Benue",        tier: "T3_NORTH" },
];

/* ── Countries (249, ISO-3166-1 alpha-2) → DHL zone ──────────────────────── */
export const COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria", zone: "Z1_WEST_AFRICA" }, // origin; domestic rates used
  { code: "AF", name: "Afghanistan", zone: "Z7_ASIA" },
  { code: "AX", name: "Åland Islands", zone: "Z3_EUROPE_WEST" },
  { code: "AL", name: "Albania", zone: "Z4_EUROPE_EAST" },
  { code: "DZ", name: "Algeria", zone: "Z2_AFRICA" },
  { code: "AS", name: "American Samoa", zone: "Z8_OCEANIA" },
  { code: "AD", name: "Andorra", zone: "Z3_EUROPE_WEST" },
  { code: "AO", name: "Angola", zone: "Z2_AFRICA" },
  { code: "AI", name: "Anguilla", zone: "Z9_LATAM_ROW" },
  { code: "AQ", name: "Antarctica", zone: "Z9_LATAM_ROW" },
  { code: "AG", name: "Antigua and Barbuda", zone: "Z9_LATAM_ROW" },
  { code: "AR", name: "Argentina", zone: "Z9_LATAM_ROW" },
  { code: "AM", name: "Armenia", zone: "Z6_MIDDLE_EAST" },
  { code: "AW", name: "Aruba", zone: "Z9_LATAM_ROW" },
  { code: "AU", name: "Australia", zone: "Z8_OCEANIA" },
  { code: "AT", name: "Austria", zone: "Z4_EUROPE_EAST" },
  { code: "AZ", name: "Azerbaijan", zone: "Z6_MIDDLE_EAST" },
  { code: "BS", name: "Bahamas", zone: "Z9_LATAM_ROW" },
  { code: "BH", name: "Bahrain", zone: "Z6_MIDDLE_EAST" },
  { code: "BD", name: "Bangladesh", zone: "Z7_ASIA" },
  { code: "BB", name: "Barbados", zone: "Z9_LATAM_ROW" },
  { code: "BY", name: "Belarus", zone: "Z4_EUROPE_EAST" },
  { code: "BE", name: "Belgium", zone: "Z3_EUROPE_WEST" },
  { code: "BZ", name: "Belize", zone: "Z9_LATAM_ROW" },
  { code: "BJ", name: "Benin", zone: "Z1_WEST_AFRICA" },
  { code: "BM", name: "Bermuda", zone: "Z5_NORTH_AMERICA" },
  { code: "BT", name: "Bhutan", zone: "Z7_ASIA" },
  { code: "BO", name: "Bolivia", zone: "Z9_LATAM_ROW" },
  { code: "BA", name: "Bosnia and Herzegovina", zone: "Z4_EUROPE_EAST" },
  { code: "BW", name: "Botswana", zone: "Z2_AFRICA" },
  { code: "BV", name: "Bouvet Island", zone: "Z9_LATAM_ROW" },
  { code: "BR", name: "Brazil", zone: "Z9_LATAM_ROW" },
  { code: "IO", name: "British Indian Ocean Territory", zone: "Z2_AFRICA" },
  { code: "VG", name: "British Virgin Islands", zone: "Z9_LATAM_ROW" },
  { code: "BN", name: "Brunei", zone: "Z7_ASIA" },
  { code: "BG", name: "Bulgaria", zone: "Z4_EUROPE_EAST" },
  { code: "BF", name: "Burkina Faso", zone: "Z1_WEST_AFRICA" },
  { code: "BI", name: "Burundi", zone: "Z2_AFRICA" },
  { code: "KH", name: "Cambodia", zone: "Z7_ASIA" },
  { code: "CM", name: "Cameroon", zone: "Z2_AFRICA" },
  { code: "CA", name: "Canada", zone: "Z5_NORTH_AMERICA" },
  { code: "CV", name: "Cape Verde", zone: "Z1_WEST_AFRICA" },
  { code: "BQ", name: "Caribbean Netherlands", zone: "Z9_LATAM_ROW" },
  { code: "KY", name: "Cayman Islands", zone: "Z9_LATAM_ROW" },
  { code: "CF", name: "Central African Republic", zone: "Z2_AFRICA" },
  { code: "TD", name: "Chad", zone: "Z2_AFRICA" },
  { code: "CL", name: "Chile", zone: "Z9_LATAM_ROW" },
  { code: "CN", name: "China", zone: "Z7_ASIA" },
  { code: "CX", name: "Christmas Island", zone: "Z8_OCEANIA" },
  { code: "CC", name: "Cocos (Keeling) Islands", zone: "Z8_OCEANIA" },
  { code: "CO", name: "Colombia", zone: "Z9_LATAM_ROW" },
  { code: "KM", name: "Comoros", zone: "Z2_AFRICA" },
  { code: "CK", name: "Cook Islands", zone: "Z8_OCEANIA" },
  { code: "CR", name: "Costa Rica", zone: "Z9_LATAM_ROW" },
  { code: "HR", name: "Croatia", zone: "Z4_EUROPE_EAST" },
  { code: "CU", name: "Cuba", zone: "Z9_LATAM_ROW" },
  { code: "CW", name: "Curaçao", zone: "Z9_LATAM_ROW" },
  { code: "CY", name: "Cyprus", zone: "Z3_EUROPE_WEST" },
  { code: "CZ", name: "Czechia", zone: "Z4_EUROPE_EAST" },
  { code: "DK", name: "Denmark", zone: "Z3_EUROPE_WEST" },
  { code: "DJ", name: "Djibouti", zone: "Z2_AFRICA" },
  { code: "DM", name: "Dominica", zone: "Z9_LATAM_ROW" },
  { code: "DO", name: "Dominican Republic", zone: "Z9_LATAM_ROW" },
  { code: "CD", name: "DR Congo", zone: "Z2_AFRICA" },
  { code: "EC", name: "Ecuador", zone: "Z9_LATAM_ROW" },
  { code: "EG", name: "Egypt", zone: "Z2_AFRICA" },
  { code: "SV", name: "El Salvador", zone: "Z9_LATAM_ROW" },
  { code: "GQ", name: "Equatorial Guinea", zone: "Z2_AFRICA" },
  { code: "ER", name: "Eritrea", zone: "Z2_AFRICA" },
  { code: "EE", name: "Estonia", zone: "Z3_EUROPE_WEST" },
  { code: "SZ", name: "Eswatini", zone: "Z2_AFRICA" },
  { code: "ET", name: "Ethiopia", zone: "Z2_AFRICA" },
  { code: "FK", name: "Falkland Islands", zone: "Z9_LATAM_ROW" },
  { code: "FO", name: "Faroe Islands", zone: "Z3_EUROPE_WEST" },
  { code: "FJ", name: "Fiji", zone: "Z8_OCEANIA" },
  { code: "FI", name: "Finland", zone: "Z3_EUROPE_WEST" },
  { code: "FR", name: "France", zone: "Z3_EUROPE_WEST" },
  { code: "GF", name: "French Guiana", zone: "Z9_LATAM_ROW" },
  { code: "PF", name: "French Polynesia", zone: "Z8_OCEANIA" },
  { code: "TF", name: "French Southern and Antarctic Lands", zone: "Z9_LATAM_ROW" },
  { code: "GA", name: "Gabon", zone: "Z2_AFRICA" },
  { code: "GM", name: "Gambia", zone: "Z1_WEST_AFRICA" },
  { code: "GE", name: "Georgia", zone: "Z6_MIDDLE_EAST" },
  { code: "DE", name: "Germany", zone: "Z3_EUROPE_WEST" },
  { code: "GH", name: "Ghana", zone: "Z1_WEST_AFRICA" },
  { code: "GI", name: "Gibraltar", zone: "Z3_EUROPE_WEST" },
  { code: "GR", name: "Greece", zone: "Z3_EUROPE_WEST" },
  { code: "GL", name: "Greenland", zone: "Z5_NORTH_AMERICA" },
  { code: "GD", name: "Grenada", zone: "Z9_LATAM_ROW" },
  { code: "GP", name: "Guadeloupe", zone: "Z9_LATAM_ROW" },
  { code: "GU", name: "Guam", zone: "Z8_OCEANIA" },
  { code: "GT", name: "Guatemala", zone: "Z9_LATAM_ROW" },
  { code: "GG", name: "Guernsey", zone: "Z3_EUROPE_WEST" },
  { code: "GN", name: "Guinea", zone: "Z1_WEST_AFRICA" },
  { code: "GW", name: "Guinea-Bissau", zone: "Z1_WEST_AFRICA" },
  { code: "GY", name: "Guyana", zone: "Z9_LATAM_ROW" },
  { code: "HT", name: "Haiti", zone: "Z9_LATAM_ROW" },
  { code: "HM", name: "Heard Island and McDonald Islands", zone: "Z9_LATAM_ROW" },
  { code: "HN", name: "Honduras", zone: "Z9_LATAM_ROW" },
  { code: "HK", name: "Hong Kong", zone: "Z7_ASIA" },
  { code: "HU", name: "Hungary", zone: "Z4_EUROPE_EAST" },
  { code: "IS", name: "Iceland", zone: "Z3_EUROPE_WEST" },
  { code: "IN", name: "India", zone: "Z7_ASIA" },
  { code: "ID", name: "Indonesia", zone: "Z7_ASIA" },
  { code: "IR", name: "Iran", zone: "Z7_ASIA" },
  { code: "IQ", name: "Iraq", zone: "Z6_MIDDLE_EAST" },
  { code: "IE", name: "Ireland", zone: "Z3_EUROPE_WEST" },
  { code: "IM", name: "Isle of Man", zone: "Z3_EUROPE_WEST" },
  { code: "IL", name: "Israel", zone: "Z6_MIDDLE_EAST" },
  { code: "IT", name: "Italy", zone: "Z3_EUROPE_WEST" },
  { code: "CI", name: "Ivory Coast", zone: "Z1_WEST_AFRICA" },
  { code: "JM", name: "Jamaica", zone: "Z9_LATAM_ROW" },
  { code: "JP", name: "Japan", zone: "Z7_ASIA" },
  { code: "JE", name: "Jersey", zone: "Z3_EUROPE_WEST" },
  { code: "JO", name: "Jordan", zone: "Z6_MIDDLE_EAST" },
  { code: "KZ", name: "Kazakhstan", zone: "Z7_ASIA" },
  { code: "KE", name: "Kenya", zone: "Z2_AFRICA" },
  { code: "KI", name: "Kiribati", zone: "Z8_OCEANIA" },
  { code: "XK", name: "Kosovo", zone: "Z4_EUROPE_EAST" },
  { code: "KW", name: "Kuwait", zone: "Z6_MIDDLE_EAST" },
  { code: "KG", name: "Kyrgyzstan", zone: "Z7_ASIA" },
  { code: "LA", name: "Laos", zone: "Z7_ASIA" },
  { code: "LV", name: "Latvia", zone: "Z3_EUROPE_WEST" },
  { code: "LB", name: "Lebanon", zone: "Z6_MIDDLE_EAST" },
  { code: "LS", name: "Lesotho", zone: "Z2_AFRICA" },
  { code: "LR", name: "Liberia", zone: "Z1_WEST_AFRICA" },
  { code: "LY", name: "Libya", zone: "Z2_AFRICA" },
  { code: "LI", name: "Liechtenstein", zone: "Z3_EUROPE_WEST" },
  { code: "LT", name: "Lithuania", zone: "Z3_EUROPE_WEST" },
  { code: "LU", name: "Luxembourg", zone: "Z3_EUROPE_WEST" },
  { code: "MO", name: "Macau", zone: "Z7_ASIA" },
  { code: "MG", name: "Madagascar", zone: "Z2_AFRICA" },
  { code: "MW", name: "Malawi", zone: "Z2_AFRICA" },
  { code: "MY", name: "Malaysia", zone: "Z7_ASIA" },
  { code: "MV", name: "Maldives", zone: "Z7_ASIA" },
  { code: "ML", name: "Mali", zone: "Z1_WEST_AFRICA" },
  { code: "MT", name: "Malta", zone: "Z3_EUROPE_WEST" },
  { code: "MH", name: "Marshall Islands", zone: "Z8_OCEANIA" },
  { code: "MQ", name: "Martinique", zone: "Z9_LATAM_ROW" },
  { code: "MR", name: "Mauritania", zone: "Z1_WEST_AFRICA" },
  { code: "MU", name: "Mauritius", zone: "Z2_AFRICA" },
  { code: "YT", name: "Mayotte", zone: "Z2_AFRICA" },
  { code: "MX", name: "Mexico", zone: "Z5_NORTH_AMERICA" },
  { code: "FM", name: "Micronesia", zone: "Z8_OCEANIA" },
  { code: "MD", name: "Moldova", zone: "Z4_EUROPE_EAST" },
  { code: "MC", name: "Monaco", zone: "Z3_EUROPE_WEST" },
  { code: "MN", name: "Mongolia", zone: "Z7_ASIA" },
  { code: "ME", name: "Montenegro", zone: "Z4_EUROPE_EAST" },
  { code: "MS", name: "Montserrat", zone: "Z9_LATAM_ROW" },
  { code: "MA", name: "Morocco", zone: "Z2_AFRICA" },
  { code: "MZ", name: "Mozambique", zone: "Z2_AFRICA" },
  { code: "MM", name: "Myanmar", zone: "Z7_ASIA" },
  { code: "NA", name: "Namibia", zone: "Z2_AFRICA" },
  { code: "NR", name: "Nauru", zone: "Z8_OCEANIA" },
  { code: "NP", name: "Nepal", zone: "Z7_ASIA" },
  { code: "NL", name: "Netherlands", zone: "Z3_EUROPE_WEST" },
  { code: "NC", name: "New Caledonia", zone: "Z8_OCEANIA" },
  { code: "NZ", name: "New Zealand", zone: "Z8_OCEANIA" },
  { code: "NI", name: "Nicaragua", zone: "Z9_LATAM_ROW" },
  { code: "NE", name: "Niger", zone: "Z1_WEST_AFRICA" },
  { code: "NU", name: "Niue", zone: "Z8_OCEANIA" },
  { code: "NF", name: "Norfolk Island", zone: "Z8_OCEANIA" },
  { code: "KP", name: "North Korea", zone: "Z7_ASIA" },
  { code: "MK", name: "North Macedonia", zone: "Z4_EUROPE_EAST" },
  { code: "MP", name: "Northern Mariana Islands", zone: "Z8_OCEANIA" },
  { code: "NO", name: "Norway", zone: "Z3_EUROPE_WEST" },
  { code: "OM", name: "Oman", zone: "Z6_MIDDLE_EAST" },
  { code: "PK", name: "Pakistan", zone: "Z7_ASIA" },
  { code: "PW", name: "Palau", zone: "Z8_OCEANIA" },
  { code: "PS", name: "Palestine", zone: "Z6_MIDDLE_EAST" },
  { code: "PA", name: "Panama", zone: "Z9_LATAM_ROW" },
  { code: "PG", name: "Papua New Guinea", zone: "Z8_OCEANIA" },
  { code: "PY", name: "Paraguay", zone: "Z9_LATAM_ROW" },
  { code: "PE", name: "Peru", zone: "Z9_LATAM_ROW" },
  { code: "PH", name: "Philippines", zone: "Z7_ASIA" },
  { code: "PN", name: "Pitcairn Islands", zone: "Z8_OCEANIA" },
  { code: "PL", name: "Poland", zone: "Z4_EUROPE_EAST" },
  { code: "PT", name: "Portugal", zone: "Z3_EUROPE_WEST" },
  { code: "PR", name: "Puerto Rico", zone: "Z9_LATAM_ROW" },
  { code: "QA", name: "Qatar", zone: "Z6_MIDDLE_EAST" },
  { code: "CG", name: "Republic of the Congo", zone: "Z2_AFRICA" },
  { code: "RE", name: "Réunion", zone: "Z2_AFRICA" },
  { code: "RO", name: "Romania", zone: "Z4_EUROPE_EAST" },
  { code: "RU", name: "Russia", zone: "Z4_EUROPE_EAST" },
  { code: "RW", name: "Rwanda", zone: "Z2_AFRICA" },
  { code: "BL", name: "Saint Barthélemy", zone: "Z9_LATAM_ROW" },
  { code: "SH", name: "Saint Helena, Ascension and Tristan da Cunha", zone: "Z1_WEST_AFRICA" },
  { code: "KN", name: "Saint Kitts and Nevis", zone: "Z9_LATAM_ROW" },
  { code: "LC", name: "Saint Lucia", zone: "Z9_LATAM_ROW" },
  { code: "MF", name: "Saint Martin", zone: "Z9_LATAM_ROW" },
  { code: "PM", name: "Saint Pierre and Miquelon", zone: "Z5_NORTH_AMERICA" },
  { code: "VC", name: "Saint Vincent and the Grenadines", zone: "Z9_LATAM_ROW" },
  { code: "WS", name: "Samoa", zone: "Z8_OCEANIA" },
  { code: "SM", name: "San Marino", zone: "Z3_EUROPE_WEST" },
  { code: "ST", name: "São Tomé and Príncipe", zone: "Z2_AFRICA" },
  { code: "SA", name: "Saudi Arabia", zone: "Z6_MIDDLE_EAST" },
  { code: "SN", name: "Senegal", zone: "Z1_WEST_AFRICA" },
  { code: "RS", name: "Serbia", zone: "Z4_EUROPE_EAST" },
  { code: "SC", name: "Seychelles", zone: "Z2_AFRICA" },
  { code: "SL", name: "Sierra Leone", zone: "Z1_WEST_AFRICA" },
  { code: "SG", name: "Singapore", zone: "Z7_ASIA" },
  { code: "SX", name: "Sint Maarten", zone: "Z9_LATAM_ROW" },
  { code: "SK", name: "Slovakia", zone: "Z4_EUROPE_EAST" },
  { code: "SI", name: "Slovenia", zone: "Z4_EUROPE_EAST" },
  { code: "SB", name: "Solomon Islands", zone: "Z8_OCEANIA" },
  { code: "SO", name: "Somalia", zone: "Z2_AFRICA" },
  { code: "ZA", name: "South Africa", zone: "Z2_AFRICA" },
  { code: "GS", name: "South Georgia", zone: "Z9_LATAM_ROW" },
  { code: "KR", name: "South Korea", zone: "Z7_ASIA" },
  { code: "SS", name: "South Sudan", zone: "Z2_AFRICA" },
  { code: "ES", name: "Spain", zone: "Z3_EUROPE_WEST" },
  { code: "LK", name: "Sri Lanka", zone: "Z7_ASIA" },
  { code: "SD", name: "Sudan", zone: "Z2_AFRICA" },
  { code: "SR", name: "Suriname", zone: "Z9_LATAM_ROW" },
  { code: "SJ", name: "Svalbard and Jan Mayen", zone: "Z3_EUROPE_WEST" },
  { code: "SE", name: "Sweden", zone: "Z3_EUROPE_WEST" },
  { code: "CH", name: "Switzerland", zone: "Z3_EUROPE_WEST" },
  { code: "SY", name: "Syria", zone: "Z6_MIDDLE_EAST" },
  { code: "TW", name: "Taiwan", zone: "Z7_ASIA" },
  { code: "TJ", name: "Tajikistan", zone: "Z7_ASIA" },
  { code: "TZ", name: "Tanzania", zone: "Z2_AFRICA" },
  { code: "TH", name: "Thailand", zone: "Z7_ASIA" },
  { code: "TL", name: "Timor-Leste", zone: "Z7_ASIA" },
  { code: "TG", name: "Togo", zone: "Z1_WEST_AFRICA" },
  { code: "TK", name: "Tokelau", zone: "Z8_OCEANIA" },
  { code: "TO", name: "Tonga", zone: "Z8_OCEANIA" },
  { code: "TT", name: "Trinidad and Tobago", zone: "Z9_LATAM_ROW" },
  { code: "TN", name: "Tunisia", zone: "Z2_AFRICA" },
  { code: "TR", name: "Türkiye", zone: "Z6_MIDDLE_EAST" },
  { code: "TM", name: "Turkmenistan", zone: "Z7_ASIA" },
  { code: "TC", name: "Turks and Caicos Islands", zone: "Z9_LATAM_ROW" },
  { code: "TV", name: "Tuvalu", zone: "Z8_OCEANIA" },
  { code: "UG", name: "Uganda", zone: "Z2_AFRICA" },
  { code: "UA", name: "Ukraine", zone: "Z4_EUROPE_EAST" },
  { code: "AE", name: "United Arab Emirates", zone: "Z6_MIDDLE_EAST" },
  { code: "GB", name: "United Kingdom", zone: "Z3_EUROPE_WEST" },
  { code: "US", name: "United States", zone: "Z5_NORTH_AMERICA" },
  { code: "UM", name: "United States Minor Outlying Islands", zone: "Z5_NORTH_AMERICA" },
  { code: "VI", name: "United States Virgin Islands", zone: "Z9_LATAM_ROW" },
  { code: "UY", name: "Uruguay", zone: "Z9_LATAM_ROW" },
  { code: "UZ", name: "Uzbekistan", zone: "Z7_ASIA" },
  { code: "VU", name: "Vanuatu", zone: "Z8_OCEANIA" },
  { code: "VA", name: "Vatican City", zone: "Z3_EUROPE_WEST" },
  { code: "VE", name: "Venezuela", zone: "Z9_LATAM_ROW" },
  { code: "VN", name: "Vietnam", zone: "Z7_ASIA" },
  { code: "WF", name: "Wallis and Futuna", zone: "Z8_OCEANIA" },
  { code: "EH", name: "Western Sahara", zone: "Z2_AFRICA" },
  { code: "YE", name: "Yemen", zone: "Z6_MIDDLE_EAST" },
  { code: "ZM", name: "Zambia", zone: "Z2_AFRICA" },
  { code: "ZW", name: "Zimbabwe", zone: "Z2_AFRICA" },
];

/* ── Compute helper ──────────────────────────────────────────────────────── */
const DEFAULT_ITEM_WEIGHT_KG = 0.5; // per unit; tune to real garment weight

/** Round weight up into number of extra half-kg steps beyond the first 0.5 kg. */
function extraHalfKgSteps(weightKg: number): number {
  return Math.max(0, Math.ceil((Math.max(weightKg, 0.5) - 0.5) / 0.5));
}

export function weightFromItemCount(itemCount: number): number {
  return Math.max(0.5, itemCount * DEFAULT_ITEM_WEIGHT_KG);
}

function tiersToRates(tiers: RateTier[], weightKg: number, idPrefix: string): ComputedRate[] {
  const steps = extraHalfKgSteps(weightKg);
  return tiers.map((t, i) => ({
    id: `${idPrefix}-${i}`,
    service_name: t.service,
    carrier_name: "DHL",
    delivery_time: t.deliveryTime,
    amount: t.base + steps * t.perHalfKg,
  }));
}

/**
 * Generate shipping rates for a destination.
 * - Nigeria: pass `stateCode` (or `stateName`) → domestic tier rates.
 * - International: rates by the country's DHL zone.
 */
export function computeShippingRates(opts: {
  countryCode: string;
  stateCode?: string;
  stateName?: string;
  weightKg?: number;
  itemCount?: number;
}): ComputedRate[] {
  const weightKg =
    opts.weightKg ??
    (opts.itemCount != null ? weightFromItemCount(opts.itemCount) : 1);

  const country = opts.countryCode?.toUpperCase();

  if (country === "NG") {
    let state = opts.stateCode
      ? NIGERIAN_STATES.find(s => s.code === opts.stateCode)
      : undefined;
    if (!state && opts.stateName) {
      const target = opts.stateName.trim().toLowerCase();
      state = NIGERIAN_STATES.find(s => s.name.toLowerCase() === target);
    }
    const tier = state?.tier ?? "T2_SOUTH_FCT"; // safe default if unmatched
    return tiersToRates(DOMESTIC_RATES[tier], weightKg, `ng-${tier}`);
  }

  const zone = COUNTRIES.find(c => c.code === country)?.zone ?? "Z9_LATAM_ROW";
  return tiersToRates(ZONE_RATES[zone], weightKg, `intl-${zone}`);
}

export function getCountries(): { code: string; name: string }[] {
  return COUNTRIES.map(({ code, name }) => ({ code, name }))
    .sort((a, b) => (a.code === "NG" ? -1 : b.code === "NG" ? 1 : a.name.localeCompare(b.name)));
}

export function getStates(countryCode: string): { code: string; name: string }[] {
  if (countryCode?.toUpperCase() !== "NG") return [];
  return NIGERIAN_STATES.map(({ code, name }) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
