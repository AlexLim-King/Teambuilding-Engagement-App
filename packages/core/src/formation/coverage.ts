/**
 * Coverage arithmetic — the ceiling on "everyone works with everyone".
 * See docs/03-team-formation.md. Team size is per activity, so coverage sums
 * over the activities actually planned.
 */

/** Share of the room (0..1) each person can meet, at best, given the planned team sizes. */
export function maxCoverage(participantCount: number, teamSizes: readonly number[]): number {
  if (participantCount <= 1) return 0;
  const contacts = teamSizes.reduce((sum, k) => sum + Math.max(0, k - 1), 0);
  return Math.min(1, contacts / (participantCount - 1));
}

/** Activities needed at a uniform team size for every pair to meet at least once. */
export function activitiesForFullCoverage(participantCount: number, teamSize: number): number {
  if (participantCount <= 1 || teamSize <= 1) return 0;
  return Math.ceil((participantCount - 1) / (teamSize - 1));
}
