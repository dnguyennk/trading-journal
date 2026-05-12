export type ThemeId =
  | "dark"
  | "bull"
  | "bear"
  | "focus"
  | "light"
  | "pastel-soft"
  | "midnight-steel"
  | "tokyo-night"
  | "synthwave"
  | "catppuccin"
  | "newsprint"
  | "clinical"
  | "mint-fresh"
  | "violet-bloom"
  | "sunset-glow";

export type ThemeMode = "dark" | "light";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
  mode: ThemeMode;
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
    mode: "dark",
    swatch: {
      bg: "oklch(0.11 0.004 60)",
      accent: "oklch(0.82 0.16 75)",
      profit: "oklch(0.82 0.16 75)",
    },
  },
  {
    id: "bull",
    label: "Sakura Optimism",
    description: "Sakura optimism",
    mode: "dark",
    swatch: {
      bg: "oklch(0.14 0.010 20)",
      accent: "oklch(0.78 0.13 20)",
      profit: "oklch(0.78 0.18 150)",
    },
  },
  {
    id: "bear",
    label: "Weathered Copper",
    description: "Weathered copper",
    mode: "dark",
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
    mode: "dark",
    swatch: {
      bg: "oklch(0.18 0.012 75)",
      accent: "oklch(0.72 0.14 75)",
      profit: "oklch(0.72 0.16 150)",
    },
  },
  {
    id: "midnight-steel",
    label: "Midnight Steel",
    description: "Graphite + steel-cyan",
    mode: "dark",
    swatch: {
      bg: "oklch(0.13 0.005 240)",
      accent: "oklch(0.82 0.08 215)",
      profit: "oklch(0.78 0.18 150)",
    },
  },
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    description: "Cool navy + lavender",
    mode: "dark",
    swatch: {
      bg: "oklch(0.18 0.030 265)",
      accent: "oklch(0.78 0.14 295)",
      profit: "oklch(0.78 0.18 150)",
    },
  },
  {
    id: "synthwave",
    label: "Synthwave",
    description: "80s neon retrowave",
    mode: "dark",
    swatch: {
      bg: "oklch(0.15 0.050 295)",
      accent: "oklch(0.74 0.22 340)",
      profit: "oklch(0.82 0.18 150)",
    },
  },
  {
    id: "catppuccin",
    label: "Catppuccin Mocha",
    description: "Pastel-dark cute",
    mode: "dark",
    swatch: {
      bg: "oklch(0.20 0.025 295)",
      accent: "oklch(0.82 0.10 340)",
      profit: "oklch(0.80 0.14 150)",
    },
  },
  {
    id: "light",
    label: "Light",
    description: "Daylight reading",
    mode: "light",
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
    mode: "light",
    swatch: {
      bg: "oklch(0.97 0.02 320)",
      accent: "oklch(0.78 0.10 320)",
      profit: "oklch(0.55 0.18 150)",
    },
  },
  {
    id: "newsprint",
    label: "Newsprint",
    description: "Cream paper + ink red",
    mode: "light",
    swatch: {
      bg: "oklch(0.96 0.012 80)",
      accent: "oklch(0.55 0.20 28)",
      profit: "oklch(0.50 0.16 150)",
    },
  },
  {
    id: "clinical",
    label: "Clinical",
    description: "Crisp white + cool slate",
    mode: "light",
    swatch: {
      bg: "oklch(0.99 0.003 240)",
      accent: "oklch(0.50 0.10 220)",
      profit: "oklch(0.52 0.16 150)",
    },
  },
  {
    id: "mint-fresh",
    label: "Mint Fresh",
    description: "Mint-tinted spa light",
    mode: "light",
    swatch: {
      bg: "oklch(0.98 0.015 165)",
      accent: "oklch(0.55 0.12 175)",
      profit: "oklch(0.52 0.18 150)",
    },
  },
  {
    id: "violet-bloom",
    label: "Violet Bloom",
    description: "Lavender + bold violet",
    mode: "light",
    swatch: {
      bg: "oklch(0.97 0.020 290)",
      accent: "oklch(0.55 0.22 295)",
      profit: "oklch(0.55 0.18 150)",
    },
  },
  {
    id: "sunset-glow",
    label: "Sunset Glow",
    description: "Warm cream + sunset orange",
    mode: "light",
    swatch: {
      bg: "oklch(0.985 0.008 50)",
      accent: "oklch(0.65 0.20 35)",
      profit: "oklch(0.55 0.18 150)",
    },
  },
] as const;

export const THEME_IDS: readonly ThemeId[] = THEMES.map((t) => t.id);
