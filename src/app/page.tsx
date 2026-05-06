import { client } from "../lib/sanity";
import Hero from "../components/Hero";
import CategorySlider from "../components/CategorySlider";
import AnnouncementBar from "../components/AnnouncementBar";
import AboutDahriola from "../components/AboutDahriola";
import ServicesGrid from "../components/ServicesGrid";
import FeaturedProducts from "../components/FeaturedProducts"; 
import ClientShowcase from "../components/ClientShowcase";
import CollectionTurntable from "../components/CollectionTurntable";

async function getProducts() {
  const query = `*[_type == "product" && defined(images)] | order(_createdAt desc) [0...6] {
    _id,
    name,
    "slug": slug.current,
    productType,
    priceNGN,
    images,
    "categoryName": category->title
  }`;

  const data = await client.fetch(query);
  return data;
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="relative w-full">
      <AnnouncementBar />
      <Hero />
      <CategorySlider />
      <AboutDahriola />
      <ServicesGrid />
      <CollectionTurntable />


      {/* Featured Collection Preview Component */}
      <FeaturedProducts products={products} />

      <ClientShowcase />
    </div>
  );
}