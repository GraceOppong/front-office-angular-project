import { DenominationLine } from './till.store';

/** Whole-number cash amount suitable for note/coin breakdown. */
export function resolveDenominationTargetAmount(amount: number | null): number | null {
  if (amount === null || amount <= 0) {
    return null;
  }
  const rounded = Math.round(amount * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) > 0.001) {
    return null;
  }
  return Math.round(rounded);
}

export function denominationLinesMatchAmount(
  lines: DenominationLine[] | null | undefined,
  amount: number,
): boolean {
  if (!lines?.length) {
    return false;
  }
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return Math.round(total * 100) === Math.round(amount * 100);
}
