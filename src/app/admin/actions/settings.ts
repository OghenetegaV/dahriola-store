"use server";

// Marketing switches, gift lists, the team list and file uploads.
import crypto from "crypto";
import { db, lc, unwrap } from "@/src/lib/supabase/admin";
import { MEDIA_BUCKET, SUPABASE_URL } from "@/src/lib/supabase/config";
import { UserError, adminAction, text } from "@/src/lib/admin/action";
import { MARKETING_DEFAULTS, optBackIn, type MarketingSettings } from "@/src/lib/marketing";

// ───────────────────────────── Marketing ─────────────────────────────

const PERCENT_LIMITS: Partial<Record<keyof MarketingSettings, [number, number]>> = {
  birthdayDiscount: [1, 90],
  anniversaryDiscount: [1, 90],
  codeValidDays: [1, 365],
  reviewRequestDelayDays: [1, 60],
  browseDiscount: [0, 50],
  abandonedCartDiscount: [0, 50],
};

export async function saveMarketingSettings(input: MarketingSettings) {
  return adminAction(async () => {
    const settings = { ...MARKETING_DEFAULTS };
    for (const key of Object.keys(MARKETING_DEFAULTS) as (keyof MarketingSettings)[]) {
      const fallback = MARKETING_DEFAULTS[key];
      const value = input?.[key];
      if (typeof fallback === "boolean") {
        (settings as Record<string, unknown>)[key] = !!value;
      } else {
        const n = Number(value);
        const [min, max] = PERCENT_LIMITS[key] || [0, 1000];
        if (!Number.isFinite(n) || n < min || n > max) {
          throw new UserError(`One of the numbers is out of range (it should be between ${min} and ${max}).`);
        }
        (settings as Record<string, unknown>)[key] = Math.round(n);
      }
    }
    unwrap(await db().from("marketing_settings").upsert({ id: 1, settings }, { onConflict: "id" }), "Saving the settings");
  });
}

/** Lets someone receive marketing emails again (only when they have asked to). */
export async function resubscribe(email: string) {
  return adminAction(async () => {
    await optBackIn(email);
  });
}

// ───────────────────────────── Gift lists ─────────────────────────────

export async function setSharedListActive(id: string, active: boolean) {
  return adminAction(async () => {
    unwrap(await db().from("shared_lists").update({ active: !!active }).eq("id", id), "Updating the list");
  });
}

// ───────────────────────────── Team ─────────────────────────────

export async function addTeamMember(input: { email: string; name: string; password: string; role: string }) {
  return adminAction(
    async () => {
      const email = text(input.email, 160).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserError("That email address doesn't look right.");
      const password = String(input.password || "");
      if (password.length < 8) throw new UserError("The starting password needs at least 8 characters.");
      const role = input.role === "owner" ? "owner" : "staff";

      const already = unwrap(await db().from("admin_users").select("email").eq("email", lc(email)).maybeSingle(), "Checking the team");
      if (already) throw new UserError("That person already has access.");

      const { error } = await db().auth.admin.createUser({ email, password, email_confirm: true });
      // Someone who already has a sign-in keeps their existing password
      if (error && !/already (been )?registered|already exists/i.test(error.message)) {
        throw new UserError(`Couldn't create the sign-in: ${error.message}`);
      }
      unwrap(await db().from("admin_users").insert({ email, name: text(input.name, 100) || null, role }), "Adding to the team");
      return { existingAccount: !!error };
    },
    { ownerOnly: true }
  );
}

export async function removeTeamMember(email: string) {
  return adminAction(
    async (admin) => {
      const target = text(email, 160).toLowerCase();
      if (target === admin.email.toLowerCase()) throw new UserError("You can't remove yourself.");
      const owners = unwrap(await db().from("admin_users").select("email").eq("role", "owner"), "Checking the team") as { email: string }[];
      if (owners.length === 1 && owners[0].email.toLowerCase() === target) {
        throw new UserError("There has to be at least one owner.");
      }
      unwrap(await db().from("admin_users").delete().eq("email", lc(target)), "Removing from the team");

      // Also remove their sign-in, so the password stops working everywhere
      try {
        const { data } = await db().auth.admin.listUsers({ page: 1, perPage: 1000 });
        const user = data?.users.find((u) => u.email?.toLowerCase() === target);
        if (user) await db().auth.admin.deleteUser(user.id);
      } catch (err) {
        console.error("Removing the sign-in failed:", err);
      }
    },
    { ownerOnly: true }
  );
}

// ───────────────────────────── Uploads ─────────────────────────────

const FOLDERS = ["products", "prints", "events", "videos"] as const;
type Folder = (typeof FOLDERS)[number];

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/**
 * Hands the browser a one-time link to send a single file straight to
 * storage. The file never passes through this server, so large photos and
 * short videos aren't held back by request size limits.
 */
export async function createUpload(input: { folder: string; fileName: string; contentType: string }) {
  return adminAction<{ path: string; token: string; publicUrl: string }>(async () => {
    const folder = (FOLDERS as readonly string[]).includes(input.folder) ? (input.folder as Folder) : null;
    if (!folder) throw new UserError("Unknown upload folder.");
    const contentType = text(input.contentType, 80).toLowerCase();
    const extension = EXTENSIONS[contentType];
    if (!extension) throw new UserError("That file type isn't supported. Use JPG, PNG or WebP photos, or MP4 / MOV videos.");
    if (contentType.startsWith("video/") !== (folder === "videos")) throw new UserError("That file type doesn't belong here.");

    const base =
      text(input.fileName, 120)
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "file";
    const path = `${folder}/${new Date().getFullYear()}/${crypto.randomBytes(6).toString("hex")}-${base}.${extension}`;

    const { data, error } = await db().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(`Upload link failed: ${error?.message}`);
    return { path, token: data.token, publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}` };
  });
}
