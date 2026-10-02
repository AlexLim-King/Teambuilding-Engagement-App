/**
 * Nomination normalisation. See docs/04-scoring-and-bias.md.
 *
 * In a team of size s, each of the other s-1 members nominates one of s-1
 * candidates, so under chance a person expects exactly 1 nomination per round
 * played. The index is therefore received / roundsPlayed, where 1.0 is chance.
 */

export function nominationIndex(received: number, roundsPlayed: number): number | null {
  if (roundsPlayed <= 0) return null;
  return received / roundsPlayed;
}

/** Probability of being nominated by one teammate under chance, in a team of `teamSize`. */
export function chanceRate(teamSize: number): number | null {
  if (teamSize <= 1) return null;
  return 1 / (teamSize - 1);
}
