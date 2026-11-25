// Wrapper for dashboard server actions: checks the person is a signed-in admin,
// turns database errors into plain-English messages, and refreshes the shop.
import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requireAdmin, type AdminUser } from "@/src/lib/admin/auth";

export type ActionResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/** Thrown for problems the person can fix (shown to them as-is). */
export class UserError extends Error {}

function friendly(err: unknown) {
  if (err instanceof UserError) return err.message;
  const message = err instanceof Error ? err.message : String(err);
  if (/duplicate key|already exists/i.test(message)) {
    return "That name, link or code is already in use. Please choose a different one.";
  }
  if (/foreign key/i.test(message)) return "This is still being used somewhere else, so it can't be removed yet.";
  if (/not configured/i.test(message)) return "The dashboard isn't connected to its database yet.";
  console.error("Dashboard action failed:", err);
  return "Something went wrong while saving. Please try again.";
}

export async function adminAction<T extends object = object>(
  fn: (admin: AdminUser) => Promise<T | void>,
  opts: { ownerOnly?: boolean } = {}
): Promise<ActionResult<T>> {
  const admin = await requireAdmin();
  if (opts.ownerOnly && admin.role !== "owner") {
    return { ok: false, error: "Only the store owner can do this." };
  }
  try {
    const result = await fn(admin);
    return { ok: true, ...((result || {}) as T) };
  } catch (err) {
    unstable_rethrow(err);
    return { ok: false, error: friendly(err) };
  }
}

/** Makes the public site pick up a change straight away. */
export function refreshShop() {
  revalidatePath("/", "layout");
}

export const text = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);
export const textOrNull = (v: unknown, max = 500) => text(v, max) || null;

/** A number from a form field, or null when left empty. */
export function numberOrNull(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
