"use client";

import { useRouter } from "next/navigation";
import { deleteReview, setReviewApproved } from "@/src/app/admin/actions/catalog";
import ConfirmDelete from "@/src/components/admin/ConfirmDelete";
import { Button, useAction } from "@/src/components/admin/ui";

export default function ReviewActions({ id, approved, name }: { id: string; approved: boolean; name: string }) {
  const router = useRouter();
  const { busy, run } = useAction();
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button
        size="sm"
        variant={approved ? "secondary" : "primary"}
        loading={busy}
        onClick={async () => {
          const res = await run(() => setReviewApproved(id, !approved), approved ? "Review hidden from the shop." : "Review approved. It's now on the shop.");
          if (res?.ok) router.refresh();
        }}
      >
        {approved ? "Hide" : "Approve"}
      </Button>
      <ConfirmDelete iconOnly action={() => deleteReview(id)} title="Delete this review?" successText="Review deleted." text={<>The review from <strong>{name}</strong> will be removed for good.</>} />
    </div>
  );
}
