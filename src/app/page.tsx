import { listProducts } from "../lib/catalog";
import Hero from "../components/Hero";
import CategorySlider from "../components/CategorySlider";
import AnnouncementBar from "../components/AnnouncementBar";
import AboutDahriola from "../components/AboutDahriola";
import ServicesGrid from "../components/ServicesGrid";
import FeaturedProducts from "../components/FeaturedProducts"; 
import ClientShowcase from "../components/ClientShowcase";
import CollectionTurntable from "../components/CollectionTurntable";
import { getActiveEvent } from "../lib/eventsData";

async function getProducts() {
  return listProducts({ withImagesOnly: true, limit: 6 });
}

export default async function HomePage() {
  const [products, activeEvent] = await Promise.all([
    getProducts(),
    getActiveEvent().catch(() => null),
  ]);

  return (
    <div className="relative w-full">
      <AnnouncementBar event={activeEvent} />
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