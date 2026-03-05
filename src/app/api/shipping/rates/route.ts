import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const { city, state, items } = await req.json();

  try {
    const response = await axios.post(
      "https://api.terminal.africa/v1/rates/quick",
      {
        address_from: {
          city: "Lagos",
          state: "Lagos",
          country: "Nigeria",
        },
        address_to: {
          city: city,
          state: state,
          country: "Nigeria",
        },
        parcel: {
          weight: items.length * 0.5, // Estimating 0.5kg per clothing item
          items: items.map((i: any) => i.name),
        },
      },
      {
        headers: { Authorization: `Bearer ${process.env.TERMINAL_AFRICA_SECRET_KEY}` },
      }
    );

    return NextResponse.json({ rates: response.data.data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}