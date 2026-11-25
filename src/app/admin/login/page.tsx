import Image from "next/image";
import { redirect } from "next/navigation";
import { dashboardReady, getAdmin } from "@/src/lib/admin/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  const ready = dashboardReady();
  if (ready && (await getAdmin())) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image src="/logo.png" alt="DAHRIOLA" width={150} height={42} className="mx-auto h-10 w-auto object-contain" priority />
          <p className="mt-3 text-[13px] uppercase tracking-[0.25em] text-neutral-500">Store dashboard</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {ready ? (
            <LoginForm expired={!!expired} />
          ) : (
            <div className="space-y-3 text-sm text-neutral-600">
              <h1 className="text-base font-semibold text-neutral-900">Almost ready</h1>
              <p>The dashboard isn&apos;t connected to its database yet. The site&apos;s developer needs to add these to the environment:</p>
              <ul className="space-y-1 rounded-lg bg-neutral-50 p-3 font-mono text-xs text-neutral-700">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</li>
                <li>SUPABASE_SECRET_KEY</li>
              </ul>
              <p className="text-xs text-neutral-500">Full steps are in SUPABASE_SETUP.md in the project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
