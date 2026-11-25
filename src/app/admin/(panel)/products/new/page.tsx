import { PageHeader } from "@/src/components/admin/blocks";
import ProductForm from "../ProductForm";
import { loadFormOptions } from "../options";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  const options = await loadFormOptions();
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "All products" }} title="Add a product" />
      <ProductForm
        {...options}
        initial={{
          name: "",
          slug: "",
          briefDescription: "",
          productType: "ready-to-wear",
          categoryId: "",
          images: [],
          printIds: [],
          priceNGN: "",
          compareAtPrice: "",
          productionTime: "",
          description: "",
          isPublished: true,
        }}
      />
    </>
  );
}
