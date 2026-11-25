"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button, Modal, useAction, type ActionResult } from "@/src/components/admin/ui";

/** A delete button that always asks first. */
export default function ConfirmDelete({
  action,
  title,
  text,
  confirmLabel = "Yes, delete",
  successText = "Deleted.",
  redirectTo,
  children,
  iconOnly,
}: {
  action: () => Promise<ActionResult>;
  title: string;
  text: ReactNode;
  confirmLabel?: string;
  successText?: string;
  /** Where to go afterwards; stays on the page (refreshed) when left out */
  redirectTo?: string;
  children?: ReactNode;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [open, setOpen] = useState(false);

  return (
    <>
      {iconOnly ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={title} title={title} className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-700">
          <Trash2 size={16} />
        </button>
      ) : (
        <Button variant="danger" onClick={() => setOpen(true)}>
          <Trash2 size={15} /> {children || "Delete"}
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={async () => {
                const res = await run(action, successText);
                if (!res?.ok) return;
                setOpen(false);
                if (redirectTo) router.push(redirectTo);
                router.refresh();
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <div className="text-sm leading-relaxed text-neutral-600">{text}</div>
      </Modal>
    </>
  );
}
