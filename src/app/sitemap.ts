import type { MetadataRoute } from "next";
import { listCategories, listProducts } from "@/src/lib/catalog";
import { listEvents } from "@/src/lib/eventsData";

const siteUrl = "https://www.dahriola.com";

// Rebuilt hourly so new products and events are picked up
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, events] = await Promise.all([listProducts(), listCategories(), listEvents()]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/category/all`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/bespoke`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `${siteUrl}/product/${product.slug}`,
    lastModified: product._updatedAt
      ? new Date(product._updatedAt)
      : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category: any) => ({
    url: `${siteUrl}/category/${category.slug}`,
    lastModified: category._updatedAt
      ? new Date(category._updatedAt)
      : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteUrl}/events/${event.slug}`,
    lastModified: event._updatedAt ? new Date(event._updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...eventPages];
}