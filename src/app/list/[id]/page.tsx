import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicList, isOwnerToken, loadListDoc } from "@/src/lib/sharedLists";
import SharedListClient from "@/src/components/SharedListClient";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ item?: string; manage?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const list = await getPublicList(id);
  if (!list) return { title: "List not found", robots: { index: false } };
  const what = list.kind === "cart" ? "cart" : "wishlist";
  const title = `${list.ownerFirstName}'s DAHRIOLA ${what}`;
  const description = list.message || `See ${list.ownerFirstName}'s picks, sizes and all, and send them a gift.`;
  const image = list.items.find((i) => i.image)?.image;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, images: image ? [{ url: image }] : ["/og-image.jpg"] },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : ["/og-image.jpg"] },
  };
}

export default async function SharedListPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { item, manage } = await searchParams;
  const doc = await loadListDoc(id);
  const isOwner = manage ? isOwnerToken(doc, manage) : false;
  // The owner can still open a list they've switched off, to switch it back on
  const list = await getPublicList(id, { doc, includeInactive: isOwner });
  if (!list) notFound();

  return <SharedListClient list={list} focusKey={item} ownerToken={isOwner ? manage : undefined} />;
}
