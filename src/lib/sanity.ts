import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

// Error prevention: If these are missing, Sanity will try to fetch an empty URL
if (!projectId || !dataset) {
  console.warn("Sanity Project ID or Dataset is missing from environment variables.");
}

// On the server, read with a token so the dataset can be private. The token is
// not a NEXT_PUBLIC_ variable, so it never reaches the browser.
const serverToken =
  typeof window === "undefined"
    ? process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN
    : undefined;

export const client = createClient({
  projectId: projectId,
  dataset: dataset,
  apiVersion: "2024-03-03",
  useCdn: false,
  token: serverToken,
  // With a token, drafts would otherwise show up on the live site
  perspective: "published",
});

// Using the builder with the correct Sanity client
const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}