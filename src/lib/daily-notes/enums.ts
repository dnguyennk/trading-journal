export const MOODS = ["great", "good", "neutral", "bad", "terrible"] as const;
export type Mood = (typeof MOODS)[number];

export const MOOD_LABELS: Record<Mood, string> = {
  great: "😄 Great",
  good: "🙂 Good",
  neutral: "😐 Neutral",
  bad: "😟 Bad",
  terrible: "😡 Terrible",
};

export const MARKET_REGIMES = [
  "trending",
  "choppy",
  "range",
  "volatile",
  "news-driven",
] as const;
export type MarketRegime = (typeof MARKET_REGIMES)[number];

export const MARKET_REGIME_LABELS: Record<MarketRegime, string> = {
  trending: "Trending",
  choppy: "Choppy",
  range: "Range",
  volatile: "Volatile",
  "news-driven": "News-driven",
};

export function isMood(v: unknown): v is Mood {
  return typeof v === "string" && (MOODS as readonly string[]).includes(v);
}

export function isMarketRegime(v: unknown): v is MarketRegime {
  return (
    typeof v === "string" &&
    (MARKET_REGIMES as readonly string[]).includes(v)
  );
}
