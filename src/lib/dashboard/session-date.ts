const ET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

type EtParts = { y: number; m: number; d: number; h: number; min: number };

function etPartsOf(tsMs: number): EtParts {
  const parts = ET_FORMATTER.formatToParts(new Date(tsMs));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    h: Number(map.hour) % 24, // Intl can emit "24" at midnight in some locales
    min: Number(map.minute),
  };
}

function keyOf(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDaysKey(key: string, delta: number): string {
  // Use UTC arithmetic on a noon-anchor to avoid DST boundary surprises
  // when shifting calendar days. The key only carries Y/M/D so timezone
  // of the anchor doesn't matter as long as it stays within the day.
  const [y, m, d] = key.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12));
  anchor.setUTCDate(anchor.getUTCDate() + delta);
  return keyOf(
    anchor.getUTCFullYear(),
    anchor.getUTCMonth() + 1,
    anchor.getUTCDate(),
  );
}

/**
 * Convert a UTC ms timestamp to its CME futures session date (ET).
 *
 * Sessions run 18:00 ET day N−1 → 17:00 ET day N and belong to day N.
 * The 17:00–18:00 ET maintenance break belongs to the just-closed session
 * (same calendar day in ET).
 */
export function sessionDateKey(tsMs: number): string {
  const { y, m, d, h } = etPartsOf(tsMs);
  const todayKey = keyOf(y, m, d);
  return h >= 18 ? addDaysKey(todayKey, 1) : todayKey;
}

/**
 * Inverse of sessionDateKey. Returns the UTC ms half-open range covering
 * the given session date: [date−1 18:00 ET, date 17:00 ET).
 */
export function sessionDateRange(date: string): {
  startMs: number;
  endMs: number;
} {
  return {
    startMs: etWallClockToUtcMs(addDaysKey(date, -1), 18, 0),
    endMs: etWallClockToUtcMs(date, 17, 0),
  };
}

/**
 * True if the session date is Saturday in ET (no session — Friday close
 * to Sunday open). Sunday is NOT considered a gap because Sunday-evening
 * trades belong to Monday, and we allow journal entries on Sunday.
 */
export function isWeekendGap(date: string): boolean {
  const [y, m, d] = date.split("-").map(Number);
  // Use noon UTC anchor + ET formatter to read the weekday safely.
  const ts = Date.UTC(y, m - 1, d, 12);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(new Date(ts));
  return weekday === "Sat";
}

// --- internal helpers ---

function etWallClockToUtcMs(
  date: string,
  hour: number,
  minute: number,
): number {
  // Iteratively converge: guess UTC ms that, when rendered in ET, matches
  // the requested wall clock. DST means a single guess is off by ±1h, so
  // we adjust by the observed delta. Two passes are sufficient because
  // the only ambiguity is the offset itself.
  const [y, m, d] = date.split("-").map(Number);
  let guess = Date.UTC(y, m - 1, d, hour, minute);
  for (let i = 0; i < 2; i++) {
    const got = etPartsOf(guess);
    const deltaMin =
      (hour - got.h) * 60 + (minute - got.min) +
      // Day rollover correction (e.g. if guess shows the day before/after)
      ((y - got.y) * 365 + (m - got.m) * 31 + (d - got.d)) * 24 * 60;
    if (deltaMin === 0) return guess;
    guess += deltaMin * 60_000;
  }
  return guess;
}
