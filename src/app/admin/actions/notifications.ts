"use server";

import { getAdmin } from "@/src/lib/admin/auth";
import { getActivity, type ActivityItem } from "@/src/lib/admin/activity";

/** Polled by the bell while the dashboard is open. Signed-in admins only. */
export async function loadActivity(): Promise<ActivityItem[] | null> {
  if (!(await getAdmin())) return null;
  return getActivity();
}
