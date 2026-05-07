import type { MetadataRoute } from "next";
import { client } from "@/src/lib/sanity";

const siteUrl = "https://www.dahriola.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await client.fetch(
    `*[_type == "product" && defined(slug.current)]{
      "slug": slug.current,
      _updatedAt
    }`
  );

  const categories = await client.fetch(
    `*[_type == "category" && defined(slug.current)]{
      "slug": slug.current,
      _updatedAt
    }`
  );

  const staticPages: MetadataRoute.Sitemap = [
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

  return [...staticPages, ...categoryPages, ...productPages];
}