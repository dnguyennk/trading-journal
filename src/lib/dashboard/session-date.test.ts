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
    const targetMs = Date.UTC(y, m - 1, d, h, min);
    const gotMs = Date.UTC(gotY, gotM - 1, gotD, gotH, gotMin);
    const deltaMin = (targetMs - gotMs) / 60_000;
    if (deltaMin === 0) return guess;
    guess += deltaMin * 60_000;
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

  it("DST start: Mon 2026-03-09 session crosses spring-forward", () => {
    const { startMs, endMs } = sessionDateRange("2026-03-09");
    // 2026 spring-forward = Sun March 8 02:00 → 03:00 local. By 18:00 Sun
    // the clocks have already sprung forward, so EDT (UTC-4) applies the
    // whole session: 18:00 ET → 22:00 UTC and 17:00 ET → 21:00 UTC.
    expect(startMs).toBe(Date.UTC(2026, 2, 8, 22, 0));
    expect(endMs).toBe(Date.UTC(2026, 2, 9, 21, 0));
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
