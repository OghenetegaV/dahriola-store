"use client";

import { useRouter } from "next/navigation";
import { deleteRsvp, setRsvpCheckedIn } from "@/src/app/admin/actions/events";
import ConfirmDelete from "@/src/components/admin/ConfirmDelete";
import { Button, useAction } from "@/src/components/admin/ui";

export default function RsvpActions({ id, checkedIn, name }: { id: string; checkedIn: boolean; name: string }) {
  const router = useRouter();
  const { busy, run } = useAction();
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant={checkedIn ? "ghost" : "secondary"}
        loading={busy}
        onClick={async () => {
          const res = await run(() => setRsvpCheckedIn(id, !checkedIn), checkedIn ? `${name} is no longer checked in.` : `${name} is checked in.`);
          if (res?.ok) router.refresh();
        }}
      >
        {checkedIn ? "Undo" : "Check in"}
      </Button>
      <ConfirmDelete
        iconOnly
        action={() => deleteRsvp(id)}
        title="Remove this RSVP?"
        confirmLabel="Yes, remove"
        successText="RSVP removed."
        text={
          <>
            <strong>{name}</strong> will be taken off the guest list and their ticket will stop working. They aren&apos;t told automatically.
          </>
        }
      />
    </div>
  );
}
