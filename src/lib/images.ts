// Image URLs. Safe to import from server and client code.
//
// Images are stored as plain URLs. New uploads live in Supabase Storage; ones
// that haven't been copied over yet may still point at the old Sanity CDN,
// which can resize on the fly.

type Size = { width?: number; height?: number; fit?: "crop" | "max" };

const TRANSFORMS_ON = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS === "on";
const PUBLIC_PATH = "/storage/v1/object/public/";

/** A usable URL for a stored image, resized where the host supports it. */
export function imageUrl(src: unknown, size: Size = {}): string {
  if (typeof src !== "string" || !src) return "";
  const { width, height, fit = height ? "crop" : "max" } = size;
  if (!width && !height) return src;

  if (src.includes("cdn.sanity.io")) {
    const q = new URLSearchParams();
    if (width) q.set("w", String(width));
    if (height) q.set("h", String(height));
    q.set("fit", fit);
    q.set("auto", "format");
    return `${src.split("?")[0]}?${q.toString()}`;
  }

  // Supabase resizing is a paid-plan feature, so it is opt-in
  if (TRANSFORMS_ON && src.includes(PUBLIC_PATH)) {
    const q = new URLSearchParams();
    if (width) q.set("width", String(width));
    if (height) q.set("height", String(height));
    q.set("resize", fit === "crop" ? "cover" : "contain");
    return `${src.split("?")[0].replace(PUBLIC_PATH, "/storage/v1/render/image/public/")}?${q.toString()}`;
  }
  return src;
}

/** First image of a product, or "". */
export function firstImage(images: unknown, size?: Size) {
  return Array.isArray(images) && images.length ? imageUrl(images[0], size) : "";
}
