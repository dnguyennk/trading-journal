export type ThemeId =
  | "dark"
  | "bull"
  | "bear"
  | "focus"
  | "light"
  | "pastel-soft"
  | "midnight-steel";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
  swatch: {
    bg: string;
    accent: string;
    profit: string;
  };
}

export const THEMES: readonly ThemeMeta[] = [
  {
    id: "dark",
    label: "Dark",
    description: "Neutral default",
    swatch: {
      bg: "oklch(0.11 0.004 60)",
      accent: "oklch(0.82 0.16 75)",
      profit: "oklch(0.82 0.16 75)",
    },
  },
  {
    id: "bull",
    label: "Bull",
    description: "Warm, optimistic",
    swatch: {
      bg: "oklch(0.13 0.012 80)",
      accent: "oklch(0.85 0.17 85)",
      profit: "oklch(0.78 0.18 150)",
    },
  },
  {
    id: "bear",
    label: "Bear",
    description: "Cool, contemplative",
    swatch: {
      bg: "oklch(0.13 0.008 250)",
      accent: "oklch(0.62 0.08 250)",
      profit: "oklch(0.72 0.18 150)",
    },
  },
  {
    id: "focus",
    label: "Focus",
    description: "Mono — calm review",
    swatch: {
      bg: "oklch(0.14 0 0)",
      accent: "oklch(0.7 0 0)",
      profit: "oklch(0.72 0.18 150)",
    },
  },
  {
    id: "light",
    label: "Light",
    description: "Daylight reading",
    swatch: {
      bg: "oklch(0.985 0.003 80)",
      accent: "oklch(0.45 0.12 75)",
      profit: "oklch(0.55 0.18 150)",
    },
  },
  {
    id: "pastel-soft",
    label: "Pastel Soft",
    description: "Soft, calm",
    swatch: {
      bg: "oklch(0.97 0.02 320)",
      accent: "oklch(0.78 0.10 320)",
      profit: "oklch(0.55 0.18 150)",
    },
  },
  {
    id: "midnight-steel",
    label: "Midnight Steel",
    description: "Technical, high-contrast",
    swatch: {
      bg: "oklch(0.08 0.015 250)",
      accent: "oklch(0.75 0.04 230)",
      profit: "oklch(0.78 0.18 150)",
    },
  },
] as const;

export const THEME_IDS: readonly ThemeId[] = THEMES.map((t) => t.id);
