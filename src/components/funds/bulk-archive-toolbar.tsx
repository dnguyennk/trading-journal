"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { archiveFunds } from "@/lib/funds/actions";

export function BulkArchiveToolbar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[];
  onClear: () => void;
}) {
  const [pending, start] = useTransition();
  if (selectedIds.length === 0) return null;
  return (
    <div className="sticky top-0 z-10 -mx-2 mb-2 flex items-center justify-between gap-3 rounded-lg border bg-card/95 px-3 py-2 backdrop-blur">
      <span className="font-mono text-xs uppercase tracking-wider">
        {selectedIds.length} selected
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onClear}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (
              !confirm(
                `Archive ${selectedIds.length} fund${selectedIds.length === 1 ? "" : "s"}? They won't show in active stats.`,
              )
            )
              return;
            start(async () => {
              await archiveFunds(selectedIds);
              onClear();
            });
          }}
          disabled={pending}
        >
          Archive
        </Button>
      </div>
    </div>
  );
}
