import Link from "next/link";
import { requireAdmin } from "@/src/lib/admin/auth";
import PasswordForm from "@/src/components/admin/PasswordForm";

export const metadata = { title: "Choose a new password" };

export default async function NewPasswordPage() {
  await requireAdmin();
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-base font-semibold text-neutral-900">Choose a new password</h1>
        <PasswordForm />
        <Link href="/admin" className="mt-5 block text-center text-[13px] text-neutral-500 hover:text-neutral-900">
          Go to the dashboard
        </Link>
      </div>
    </div>
  );
}
