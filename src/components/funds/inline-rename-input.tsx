"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { renameFund } from "@/lib/funds/actions";

export function InlineRenameInput({
  fundId,
  name,
}: {
  fundId: string;
  name: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [committed, setCommitted] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, start] = useTransition();

  useEffect(() => {
    setCommitted(name);
    setValue(name);
  }, [name]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const next = value.trim();
    setEditing(false);
    if (next === committed || next.length === 0) {
      setValue(committed);
      return;
    }
    setCommitted(next);
    start(async () => {
      const res = await renameFund(fundId, next);
      if (!res.ok) {
        setCommitted(name);
        setValue(name);
      }
    });
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") {
            setValue(committed);
            setEditing(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-transparent font-serif text-base font-semibold outline-none ring-1 ring-primary/40 rounded px-1"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="truncate text-left font-serif text-base font-semibold"
      title="Double-click to rename"
    >
      {committed}
    </button>
  );
}
