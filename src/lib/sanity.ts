import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

// Error prevention: If these are missing, Sanity will try to fetch an empty URL
if (!projectId || !dataset) {
  console.warn("Sanity Project ID or Dataset is missing from environment variables.");
}

export const client = createClient({
  projectId: projectId,
  dataset: dataset,
  apiVersion: "2024-03-03",
  useCdn: false, 
});

// Using the builder with the correct Sanity client
const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}