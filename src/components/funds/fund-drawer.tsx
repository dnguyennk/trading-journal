"use client";

import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FundDetail } from "@/components/funds/fund-detail";
import type { FundEvent } from "@/db/schema";
import type { FundWithStats } from "@/lib/funds/types";

export function FundDrawer({
  fund,
  events,
}: {
  fund: FundWithStats | null;
  events: FundEvent[];
}) {
  const router = useRouter();
  const open = fund !== null;
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) router.push("/funds", { scroll: false });
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 isolate z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-xs",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0",
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-0 right-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l bg-background p-6 shadow-xl",
            "data-open:animate-in data-open:slide-in-from-right",
            "data-closed:animate-out data-closed:slide-out-to-right",
          )}
        >
          <DialogPrimitive.Close
            className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </DialogPrimitive.Close>
          {fund && <FundDetail fund={fund} events={events} />}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
