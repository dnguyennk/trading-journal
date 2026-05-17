import { describe, expect, it } from "vitest";
import {
  isWeekendGap,
  sessionDateKey,
  sessionDateRange,
} from "./session-date";

// Helper: build a UTC ms timestamp from an ET wall-clock spec.
// Iterates until the ET-formatted timestamp matches the requested
// (y, m, d, h, min) exactly. Same shape as the production helper —
// two passes is enough, we loop three for safety. Acceptable in tests only.
function etWallClockMs(
  y: number,
  m: number,
  d: number,
  h: number,
  min: number,
): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  let guess = Date.UTC(y, m - 1, d, h, min);
  for (let i = 0; i < 3; i++) {
    const parts = fmt.formatToParts(new Date(guess));
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    const gotY = Number(map.year);
    const gotM = Number(map.month);
    const gotD = Number(map.day);
    const gotH = Number(map.hour) % 24;
    const gotMin = Number(map.minute);
    if (
      gotY === y &&
      gotM === m &&
      gotD === d &&
      gotH === h &&
      gotMin === min
    ) {
      return guess;
    }
    // Compute delta in minutes accounting for day shifts.
    const targetTotalMin = (d * 24 + h) * 60 + min;
    const gotTotalMin = (gotD * 24 + gotH) * 60 + gotMin;
    // Year/month delta in days (rough — fine within ±1 day which is all we need)
    const monthDayDelta = (y - gotY) * 365 + (m - gotM) * 30;
    guess +=
      (targetTotalMin - gotTotalMin + monthDayDelta * 24 * 60) * 60_000;
  }
  return guess;
}

describe("sessionDateKey", () => {
  it("Wed 14:00 ET → same Wed", () => {
    const ts = etWallClockMs(2026, 5, 20, 14, 0);
    expect(sessionDateKey(ts)).toBe("2026-05-20");
  });

  it("Sun 22:00 ET → following Mon", () => {
    const ts = etWallClockMs(2026, 5, 17, 22, 0);
    expect(sessionDateKey(ts)).toBe("2026-05-18");
  });

  it("Mon 02:00 ET → same Mon (overnight continuation)", () => {
    const ts = etWallClockMs(2026, 5, 18, 2, 0);
    expect(sessionDateKey(ts)).toBe("2026-05-18");
  });

  it("Tue 17:30 ET (maintenance break) → same Tue", () => {
    const ts = etWallClockMs(2026, 5, 19, 17, 30);
    expect(sessionDateKey(ts)).toBe("2026-05-19");
  });

  it("Fri 16:00 ET → same Fri", () => {
    const ts = etWallClockMs(2026, 5, 22, 16, 0);
    expect(sessionDateKey(ts)).toBe("2026-05-22");
  });

  it("Mon 18:00 ET → next Tue", () => {
    const ts = etWallClockMs(2026, 5, 18, 18, 0);
    expect(sessionDateKey(ts)).toBe("2026-05-19");
  });

  it("DST start: Sun 2026-03-08 18:00 ET → Mon 2026-03-09", () => {
    const ts = etWallClockMs(2026, 3, 8, 18, 0);
    expect(sessionDateKey(ts)).toBe("2026-03-09");
  });

  it("DST end: Sun 2026-11-01 18:00 ET → Mon 2026-11-02", () => {
    const ts = etWallClockMs(2026, 11, 1, 18, 0);
    expect(sessionDateKey(ts)).toBe("2026-11-02");
  });
});

describe("sessionDateRange", () => {
  it("Mon 2026-05-18 covers [Sun 18:00 ET, Mon 17:00 ET)", () => {
    const { startMs, endMs } = sessionDateRange("2026-05-18");
    expect(startMs).toBe(etWallClockMs(2026, 5, 17, 18, 0));
    expect(endMs).toBe(etWallClockMs(2026, 5, 18, 17, 0));
  });

  it("range is round-trip consistent with sessionDateKey", () => {
    const { startMs, endMs } = sessionDateRange("2026-05-18");
    expect(sessionDateKey(startMs)).toBe("2026-05-18");
    expect(sessionDateKey(endMs - 1)).toBe("2026-05-18");
  });
});

describe("isWeekendGap", () => {
  it("Saturday is a gap", () => {
    expect(isWeekendGap("2026-05-23")).toBe(true); // Sat
  });

  it("Sunday is NOT a gap (we allow journaling)", () => {
    expect(isWeekendGap("2026-05-24")).toBe(false); // Sun
  });

  it("Weekday is not a gap", () => {
    expect(isWeekendGap("2026-05-20")).toBe(false); // Wed
  });
});
