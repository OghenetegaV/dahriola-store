"use client";

import { useActionState } from "react";
import { setNewPassword } from "@/src/app/admin/actions/auth";
import { Button, Field, Input } from "@/src/components/admin/ui";

export default function PasswordForm() {
  const [state, action, pending] = useActionState(setNewPassword, null);
  return (
    <form action={action} className="max-w-sm space-y-4">
      <Field label="New password" hint="At least 8 characters.">
        <Input type="password" name="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label="Type it again">
        <Input type="password" name="confirm" autoComplete="new-password" required minLength={8} />
      </Field>
      {state?.error && <p className="text-[13px] text-red-600">{state.error}</p>}
      {state?.message && <p className="rounded-lg bg-emerald-50 p-3 text-[13px] text-emerald-800">{state.message}</p>}
      <Button type="submit" loading={pending}>
        Change password
      </Button>
    </form>
  );
}
