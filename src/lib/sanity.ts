import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-03-03", // Use current date
  useCdn: false, // Set to false for real-time updates in the studio
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}