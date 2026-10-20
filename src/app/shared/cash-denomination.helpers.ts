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

export function parseWholeAmountInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return 0;
  }
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function quantityFromEnteredAmount(
  enteredAmount: number,
  denomination: number,
  availableQty?: number,
): number {
  if (enteredAmount <= 0 || denomination <= 0) {
    return 0;
  }
  let quantity = Math.floor(enteredAmount / denomination);
  if (availableQty !== undefined) {
    quantity = Math.min(quantity, Math.max(0, availableQty));
  }
  return quantity;
}

export function amountDraftFromQuantity(quantity: number, denomination: number): string {
  return quantity > 0 ? String(quantity * denomination) : '';
}
