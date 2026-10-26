import { denominationDescriptionFor } from './currency-denominations';

/** @deprecated Prefer denominationDescriptionFor with currency */
export const DENOMINATION_DESCRIPTIONS: Record<string, string> = {
  '200': 'Two Hundred Cedis',
  '100': 'One Hundred Cedis',
  '50': 'Fifty Cedis',
  '20': 'Twenty Cedis',
  '10': 'Ten Cedis',
  '5': 'Five Cedis',
  '2': 'Two Cedis',
  '1': 'One Cedi',
};

export function denominationDescription(value: string, currency?: string | null): string {
  return denominationDescriptionFor(value, currency);
}
