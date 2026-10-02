/**
 * Balance arithmetic. Integers only — see docs/10-currency.md.
 * A reversal is itself an entry with the opposite amount, so a plain sum is
 * always correct and there is no "where not reversed" filtering to get wrong.
 */

export type LedgerKind = 'award' | 'adjustment' | 'redemption' | 'reversal';

export interface LedgerEntry {
  id: string;
  kind: LedgerKind;
  /** Signed, in whole currency units. Never a float. */
  amount: number;
}

export class NonIntegerAmountError extends Error {
  constructor(amount: number) {
    super(`Currency amounts must be integers, received ${amount}`);
    this.name = 'NonIntegerAmountError';
  }
}

function assertInteger(amount: number): void {
  if (!Number.isInteger(amount)) throw new NonIntegerAmountError(amount);
}

/** Released balance. Pending awards live in a separate table and never count here. */
export function balanceOf(entries: readonly LedgerEntry[]): number {
  let total = 0;
  for (const entry of entries) {
    assertInteger(entry.amount);
    total += entry.amount;
  }
  return total;
}

/** The compensating entry that undoes `entry`, leaving the original untouched. */
export function reversalOf(entry: LedgerEntry, newId: string): LedgerEntry {
  assertInteger(entry.amount);
  return { id: newId, kind: 'reversal', amount: -entry.amount };
}
