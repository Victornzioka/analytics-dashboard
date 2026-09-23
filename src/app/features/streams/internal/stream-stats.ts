/**
 * INTERNAL TO THE STREAMS FEATURE.
 *
 * Nothing outside `features/streams/` imports this. It is not a shared utility and it
 * is not part of any public surface. If another feature needs this arithmetic, the
 * arithmetic moves somewhere shared first.
 */
export function weightedMean(groups: { mean: number; candidates: number }[]): number {
  let weighted = 0;
  let count = 0;
  for (const g of groups) {
    weighted += g.mean * g.candidates;
    count += g.candidates;
  }
  return count === 0 ? 0 : weighted / count;
}

export function spread(groups: { mean: number }[]): number {
  if (groups.length === 0) {
    return 0;
  }
  const means = groups.map((g) => g.mean);
  return Math.max(...means) - Math.min(...means);
}
