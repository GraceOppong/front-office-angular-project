/** Human-readable labels for standard Ghana cedi note/coin denominations. */
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

export function denominationDescription(value: string): string {
  return DENOMINATION_DESCRIPTIONS[value] ?? value;
}
