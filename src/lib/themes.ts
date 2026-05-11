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
    description: "Sakura optimism",
    swatch: {
      bg: "oklch(0.14 0.010 20)",
      accent: "oklch(0.78 0.13 20)",
      profit: "oklch(0.78 0.18 150)",
    },
  },
  {
    id: "bear",
    label: "Bear",
    description: "Weathered copper",
    swatch: {
      bg: "oklch(0.13 0.012 60)",
      accent: "oklch(0.65 0.13 45)",
      profit: "oklch(0.72 0.18 150)",
    },
  },
  {
    id: "focus",
    label: "Focus",
    description: "Gruvbox warmth",
    swatch: {
      bg: "oklch(0.18 0.012 75)",
      accent: "oklch(0.72 0.14 75)",
      profit: "oklch(0.72 0.16 150)",
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
    description: "Graphite + steel-cyan",
    swatch: {
      bg: "oklch(0.13 0.005 240)",
      accent: "oklch(0.82 0.08 215)",
      profit: "oklch(0.78 0.18 150)",
    },
  },
] as const;

export const THEME_IDS: readonly ThemeId[] = THEMES.map((t) => t.id);
