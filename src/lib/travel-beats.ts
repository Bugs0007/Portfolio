// Shared grouping math for the Travel gallery modes. The problem every mode
// solves the same way: turn N media items into a small, bounded number of
// "beats" (visual moments), so scroll length tracks beat count instead of
// raw media count. A journey with 6 items or fewer is already a handful of
// beats, so it passes through unchanged; compression only kicks in once a
// journey has enough media that one-beat-per-item would drag.
// Module-private: nothing outside this file used it once the other gallery
// modes were deleted.
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function beatCountFor(
  n: number,
  opts: { base?: number; growth?: number; min?: number; max?: number } = {},
): number {
  const { base = 6, growth = 1.4, min = 1, max = 12 } = opts;
  if (n <= 0) return 0;
  if (n <= base) return n;
  const raw = Math.round(base + Math.sqrt(n - base) * growth);
  return clamp(raw, min, Math.min(max, n));
}

// Same 0.6-viewport-heights-per-item rate the original single-ribbon rail
// used, just applied to the (capped) beat count instead of the raw media
// count. Below the compression threshold this is numerically identical to
// the old `Math.max(1.6, media.length * 0.6)`, so short journeys don't
// change; long ones stop growing once beatCount saturates at its mode cap.
export function railSpanForBeats(beatCount: number, perBeat = 0.6, floor = 1.6): number {
  return Math.max(floor, beatCount * perBeat);
}

// Contiguous, order-preserving chunking: item order within a journey is
// meaningful (it's chronological), so beats are always contiguous slices,
// never a shuffle. Remainder items go to the earliest groups.
export function chunkMedia<T>(items: readonly T[], groups: number): T[][] {
  if (groups <= 0 || items.length === 0) return [];
  const g = Math.min(groups, items.length);
  const base = Math.floor(items.length / g);
  const extra = items.length % g;
  const out: T[][] = [];
  let idx = 0;
  for (let i = 0; i < g; i++) {
    const size = base + (i < extra ? 1 : 0);
    out.push(items.slice(idx, idx + size));
    idx += size;
  }
  return out;
}
