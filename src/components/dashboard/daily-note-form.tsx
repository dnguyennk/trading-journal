"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DailyNote } from "@/db/schema";
import { upsertDailyNote } from "@/lib/dashboard/day-detail";
import {
  isMarketRegime,
  isMood,
  MARKET_REGIMES,
  MARKET_REGIME_LABELS,
  MOODS,
  MOOD_LABELS,
  type MarketRegime,
  type Mood,
} from "@/lib/daily-notes/enums";
import { cn } from "@/lib/utils";

export function DailyNoteForm({
  date,
  note,
}: {
  date: string;
  note: DailyNote | null;
}) {
  const [mood, setMood] = useState<Mood | null>(
    isMood(note?.mood) ? note.mood : null,
  );
  const [regime, setRegime] = useState<MarketRegime | null>(
    isMarketRegime(note?.marketRegime) ? note.marketRegime : null,
  );
  const [notes, setNotes] = useState(note?.generalNotes ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleMood(next: Mood) {
    setMood((cur) => (cur === next ? null : next));
    setSaved(false);
  }

  function toggleRegime(next: MarketRegime) {
    setRegime((cur) => (cur === next ? null : next));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await upsertDailyNote(date, {
        mood,
        marketRegime: regime,
        generalNotes: notes,
      });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Mood
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mood === m}
              onClick={() => toggleMood(m)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                mood === m
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Market regime
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {MARKET_REGIMES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={regime === r}
              onClick={() => toggleRegime(r)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
                regime === r
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {MARKET_REGIME_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor={`daily-note-${date}`}
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          Notes
        </Label>
        <Textarea
          id={`daily-note-${date}`}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="How did the day go? Lessons, mistakes, market context…"
          rows={4}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save note"}
        </Button>
        {saved && !pending && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-profit">
            <Check className="h-3 w-3" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
