"use client";

import { useActionState, useState } from "react";
import { requestPasswordReset, signIn } from "@/src/app/admin/actions/auth";
import { Button, Field, Input } from "@/src/components/admin/ui";

export default function LoginForm({ expired }: { expired: boolean }) {
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [signInState, signInAction, signingIn] = useActionState(signIn, null);
  const [resetState, resetAction, resetting] = useActionState(requestPasswordReset, null);
  const [email, setEmail] = useState("");

  if (mode === "reset") {
    return (
      <form action={resetAction} className="space-y-4">
        <div>
          <h1 className="text-base font-semibold text-neutral-900">Reset your password</h1>
          <p className="mt-1 text-[13px] text-neutral-500">We&apos;ll email you a link to choose a new one.</p>
        </div>
        <Field label="Email">
          <Input type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {resetState?.error && <p className="text-[13px] text-red-600">{resetState.error}</p>}
        {resetState?.message && <p className="rounded-lg bg-emerald-50 p-3 text-[13px] text-emerald-800">{resetState.message}</p>}
        <Button type="submit" loading={resetting} className="w-full">
          Send reset link
        </Button>
        <button type="button" onClick={() => setMode("signin")} className="block w-full text-center text-[13px] text-neutral-500 hover:text-neutral-900">
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form action={signInAction} className="space-y-4">
      <h1 className="text-base font-semibold text-neutral-900">Sign in</h1>
      {expired && !signInState?.error && (
        <p className="rounded-lg bg-amber-50 p-3 text-[13px] text-amber-800">
          That link has expired or was opened on a different device. Please request a new one.
        </p>
      )}
      <Field label="Email">
        <Input type="email" name="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password">
        <Input type="password" name="password" autoComplete="current-password" required />
      </Field>
      {signInState?.error && <p className="text-[13px] text-red-600">{signInState.error}</p>}
      <Button type="submit" loading={signingIn} className="w-full">
        Sign in
      </Button>
      <button type="button" onClick={() => setMode("reset")} className="block w-full text-center text-[13px] text-neutral-500 hover:text-neutral-900">
        Forgot your password?
      </button>
    </form>
  );
}
