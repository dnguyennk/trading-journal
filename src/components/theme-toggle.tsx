"use client";

import { Check, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES, type ThemeId } from "@/lib/themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- next-themes hydration guard
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Choose theme"
        disabled
        className="ml-1"
      >
        <Palette className="h-4 w-4" aria-hidden />
      </Button>
    );
  }

  const active = (theme ?? "dark") as ThemeId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Choose theme"
            className="ml-1"
          />
        }
      >
        <Palette className="h-4 w-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-4 w-8 overflow-hidden rounded-sm border border-border/50"
              >
                <span className="flex-1" style={{ background: t.swatch.bg }} />
                <span
                  className="flex-1"
                  style={{ background: t.swatch.accent }}
                />
                <span
                  className="flex-1"
                  style={{ background: t.swatch.profit }}
                />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm">{t.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {t.description}
                </span>
              </span>
            </span>
            {active === t.id && (
              <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
