/** Shared domain vocabulary. Mirrors docs/02-data-model.md. */

export type Gender = 'male' | 'female' | 'unspecified';

export interface Person {
  id: string;
  displayName: string;
  department: string | null;
  gender: Gender;
  isLeadership: boolean;
}

/** An activity from the reusable library (docs/02). Team size belongs here, not to the event. */
export interface ActivityDefinition {
  id: string;
  name: string;
  defaultTeamSize: number;
  minTeamSize: number;
  maxTeamSize: number;
  isCompetitive: boolean;
}

/** How often each unordered pair has shared a team. Key: `${a}|${b}` with a < b. */
export type PairHistory = ReadonlyMap<string, number>;

/** Directed rater -> ratee pairs already used. Key: `${rater}|${ratee}`. */
export type RatingHistory = ReadonlySet<string>;

export interface Team {
  number: number;
  memberIds: readonly string[];
}

export interface FormationWeights {
  genderBalance: number;
  sameDepartment: number;
  repeatPair: number;
  leaderRepeat: number;
  sizeBalance: number;
  hardViolation: number;
}

/** Defaults from docs/03. Balance-first priority. */
export const DEFAULT_WEIGHTS: FormationWeights = {
  genderBalance: 25,
  sameDepartment: 15,
  repeatPair: 10,
  leaderRepeat: 8,
  sizeBalance: 5,
  hardViolation: 1000,
};

/** Unordered pair key, stable regardless of argument order. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Directed rater -> ratee key. */
export function arcKey(rater: string, ratee: string): string {
  return `${rater}|${ratee}`;
}
