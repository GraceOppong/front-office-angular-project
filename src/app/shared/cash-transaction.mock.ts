export interface AccountSnapshot {
  accountName: string;
  availableBalance: number;
  clearedBalance: number;
  unclearedBalance: number;
  odAmount: number;
  blockAmount: number;
  branch: string;
  product: string;
  currency: string;
}

export const CASH_TRANSACTION_MOCK_ACCOUNTS: Record<string, AccountSnapshot> = {
  '1002003004': {
    accountName: 'KWAME MENSAH CURRENT',
    availableBalance: 45820.55,
    clearedBalance: 45200.55,
    unclearedBalance: 620,
    odAmount: 0,
    blockAmount: 500,
    branch: 'HEAD OFFICE',
    product: 'CURRENT ACCOUNT',
    currency: 'GHANA CEDIS',
  },
  '2003004005': {
    accountName: 'AMA ADJEI SAVINGS',
    availableBalance: 12840,
    clearedBalance: 12840,
    unclearedBalance: 0,
    odAmount: 0,
    blockAmount: 0,
    branch: 'HEAD OFFICE',
    product: 'SAVINGS ACCOUNT',
    currency: 'GHANA CEDIS',
  },
};

export function formatCashAmount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
