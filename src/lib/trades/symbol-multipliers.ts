export const MULTIPLIER: Record<string, number> = {
  // Micros
  MNQ: 2,
  MES: 5,
  M2K: 5,
  MYM: 0.5,
  MGC: 10,
  MCL: 100,
  // Full size
  NQ: 20,
  ES: 50,
  RTY: 50,
  YM: 5,
  GC: 100,
  CL: 1000,
};

export const DEFAULT_MULTIPLIER = 1;

export function multiplierFor(symbol: string): number {
  return MULTIPLIER[symbol.toUpperCase()] ?? DEFAULT_MULTIPLIER;
}
