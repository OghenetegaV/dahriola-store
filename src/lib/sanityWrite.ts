// Server-only Sanity client with the write token. Import it only from server
// actions and API routes — never from client components.
import { createClient } from "@sanity/client";

export const writeClient = createClient({
  projectId:
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID!,
  dataset:
    process.env.NEXT_PUBLIC_SANITY_DATASET ??
    process.env.SANITY_DATASET ??
    "production",
  apiVersion: "2024-03-03",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
