import { describe, it, expect } from 'vitest';
import {
  maxCoverage,
  activitiesForFullCoverage,
  balanceOf,
  reversalOf,
  nominationIndex,
  NonIntegerAmountError,
  pairKey,
  arcKey,
  type LedgerEntry,
} from '../src/index';

describe('coverage', () => {
  it('matches the documented figures for the real event shape', () => {
    // docs/03: 40 people, teams of 10, 4 activities -> 92%
    expect(Math.round(maxCoverage(40, [10, 10, 10, 10]) * 100)).toBe(92);
    // 80 people, teams of 5, 4 activities -> 20%
    expect(Math.round(maxCoverage(80, [5, 5, 5, 5]) * 100)).toBe(20);
  });

  it('sums per-activity team sizes for a mixed day', () => {
    // docs/03: 60 people across 5, 10, 8, 6 -> (4+9+7+5)/59 = 42%
    expect(Math.round(maxCoverage(60, [5, 10, 8, 6]) * 100)).toBe(42);
  });

  it('never exceeds 1', () => {
    expect(maxCoverage(10, [10, 10, 10])).toBe(1);
  });

  it('degrades safely at the edges', () => {
    expect(maxCoverage(1, [5])).toBe(0);
    expect(maxCoverage(0, [])).toBe(0);
    expect(activitiesForFullCoverage(40, 1)).toBe(0);
  });

  it('reports activities needed for full coverage', () => {
    expect(activitiesForFullCoverage(40, 10)).toBe(5);
    expect(activitiesForFullCoverage(80, 5)).toBe(20);
  });
});

describe('ledger', () => {
  const entries: LedgerEntry[] = [
    { id: 'a', kind: 'award', amount: 50 },
    { id: 'b', kind: 'award', amount: 40 },
    { id: 'c', kind: 'redemption', amount: -90 },
  ];

  it('derives the balance as a plain sum', () => {
    expect(balanceOf(entries)).toBe(0);
    expect(balanceOf(entries.slice(0, 2))).toBe(90);
  });

  it('is empty-safe', () => {
    expect(balanceOf([])).toBe(0);
  });

  it('restores the balance exactly via a reversal', () => {
    const award = entries[0]!;
    const reversal = reversalOf(award, 'r1');
    expect(reversal.amount).toBe(-50);
    expect(balanceOf([award, reversal])).toBe(0);
  });

  it('refuses non-integer amounts', () => {
    expect(() => balanceOf([{ id: 'x', kind: 'award', amount: 0.5 }])).toThrow(
      NonIntegerAmountError,
    );
  });
});

describe('nominations', () => {
  it('treats one nomination per round played as chance', () => {
    expect(nominationIndex(4, 4)).toBe(1);
    expect(nominationIndex(10, 4)).toBe(2.5);
    expect(nominationIndex(0, 4)).toBe(0);
  });

  it('returns null rather than dividing by zero', () => {
    expect(nominationIndex(3, 0)).toBeNull();
  });
});

describe('keys', () => {
  it('makes pair keys order-independent and arc keys directional', () => {
    expect(pairKey('b', 'a')).toBe(pairKey('a', 'b'));
    expect(arcKey('a', 'b')).not.toBe(arcKey('b', 'a'));
  });
});
