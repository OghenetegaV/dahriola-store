"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resubscribe } from "@/src/app/admin/actions/settings";
import { Button, Modal, useAction } from "@/src/components/admin/ui";

export default function ResubscribeButton({ email }: { email: string }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Resubscribe
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Resubscribe this person?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                const res = await run(() => resubscribe(email), `${email} can receive marketing emails again.`);
                if (res?.ok) {
                  setOpen(false);
                  router.refresh();
                }
              }}
            >
              They asked me to
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-neutral-600">
          <strong>{email}</strong> chose to stop marketing emails. Only undo this if they have asked you to. If they are also blocked in Brevo, unblock them there too.
        </p>
      </Modal>
    </>
  );
}
