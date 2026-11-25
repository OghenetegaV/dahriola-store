"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addTeamMember, removeTeamMember } from "@/src/app/admin/actions/settings";
import ConfirmDelete from "@/src/components/admin/ConfirmDelete";
import { Badge, Button, Card, Field, Input, Modal, Select, useAction, useToast } from "@/src/components/admin/ui";

export type TeamMember = { email: string; name: string | null; role: "owner" | "staff"; created_at: string };

const EMPTY = { email: "", name: "", password: "", role: "staff" };

export default function TeamManager({ team, me, isOwner }: { team: TeamMember[]; me: string; isOwner: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { busy, run } = useAction();
  const [draft, setDraft] = useState<typeof EMPTY | null>(null);
  const set = (patch: Partial<typeof EMPTY>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const add = async () => {
    if (!draft) return;
    const res = await run(() => addTeamMember(draft));
    if (!res?.ok) return;
    toast.success(
      res.existingAccount
        ? `${draft.email} now has access. They already had a sign-in, so their existing password still applies.`
        : `${draft.email} can now sign in with the starting password.`
    );
    setDraft(null);
    router.refresh();
  };

  return (
    <>
      <Card
        title="Team"
        description="Owners can add and remove people. Staff can do everything else."
        padded={false}
        action={
          isOwner ? (
            <Button size="sm" onClick={() => setDraft(EMPTY)}>
              <Plus size={14} /> Add person
            </Button>
          ) : undefined
        }
      >
        <ul className="divide-y divide-neutral-100">
          {team.map((m) => (
            <li key={m.email} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold uppercase text-neutral-600">
                {(m.name || m.email).slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-900">
                  {m.name || m.email}
                  {m.email.toLowerCase() === me.toLowerCase() && <Badge>You</Badge>}
                  <Badge tone={m.role === "owner" ? "violet" : "neutral"}>{m.role === "owner" ? "Owner" : "Staff"}</Badge>
                </p>
                {m.name && <p className="truncate text-xs text-neutral-500">{m.email}</p>}
              </div>
              {isOwner && m.email.toLowerCase() !== me.toLowerCase() && (
                <ConfirmDelete
                  iconOnly
                  action={() => removeTeamMember(m.email)}
                  title="Remove this person?"
                  confirmLabel="Yes, remove"
                  successText="Access removed."
                  text={
                    <>
                      <strong>{m.name || m.email}</strong> will no longer be able to sign in to the dashboard.
                    </>
                  }
                />
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title="Add someone to the team"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={add} loading={busy}>
              Give access
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Name">
              <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" autoComplete="off" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="Starting password" hint="At least 8 characters. Share it with them privately and ask them to change it under Settings after signing in.">
              <Input type="text" autoComplete="off" value={draft.password} onChange={(e) => set({ password: e.target.value })} />
            </Field>
            <Field label="Role" hint="Owners can also add and remove team members.">
              <Select value={draft.role} onChange={(e) => set({ role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
              </Select>
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}
