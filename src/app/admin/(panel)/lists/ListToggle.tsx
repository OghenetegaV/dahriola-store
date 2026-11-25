"use client";

import { useRouter } from "next/navigation";
import { setSharedListActive } from "@/src/app/admin/actions/settings";
import { Button, useAction } from "@/src/components/admin/ui";

export default function ListToggle({ id, active, owner }: { id: string; active: boolean; owner: string }) {
  const router = useRouter();
  const { busy, run } = useAction();
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={busy}
      onClick={async () => {
        const res = await run(() => setSharedListActive(id, !active), active ? `The link to ${owner}'s list is off.` : `The link to ${owner}'s list is back on.`);
        if (res?.ok) router.refresh();
      }}
    >
      {active ? "Switch link off" : "Switch link on"}
    </Button>
  );
}
