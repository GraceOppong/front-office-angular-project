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

const TEN_DIGIT_ACCOUNT = /^\d{10}$/;

const SYNTHETIC_ACCOUNT_NAMES = [
  'AMA MENSAH',
  'KOFI OWUSU',
  'HENRY AMOH',
  'AKUA BOATENG',
  'YAW ASANTE',
  'EFUA DARKO',
  'NANA ADJEI',
  'SERWA ACHEAMPONG',
];

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

function buildSyntheticAccount(accountNumber: string): AccountSnapshot {
  const tail = Number(accountNumber.slice(-6));
  const nameIdx = Number(accountNumber.slice(-2)) % SYNTHETIC_ACCOUNT_NAMES.length;
  const isSavings = tail % 2 === 0;
  const cleared = Math.round((8000 + (tail % 750000) / 100) * 100) / 100;
  const uncleared = tail % 5 === 0 ? Math.round(cleared * 0.04 * 100) / 100 : 0;
  const block = tail % 7 === 0 ? 250 : 0;

  return {
    accountName: `${SYNTHETIC_ACCOUNT_NAMES[nameIdx]} ${isSavings ? 'SAVINGS' : 'CURRENT'}`,
    availableBalance: cleared - block,
    clearedBalance: cleared,
    unclearedBalance: uncleared,
    odAmount: 0,
    blockAmount: block,
    branch: 'HEAD OFFICE',
    product: isSavings ? 'SAVINGS ACCOUNT' : 'CURRENT ACCOUNT',
    currency: 'GHANA CEDIS',
  };
}

/** Known demo accounts or any 10-digit account number. */
export function resolveCashTransactionAccount(accountNumber: string): AccountSnapshot | null {
  const key = accountNumber.trim();
  if (!key) {
    return null;
  }

  const predefined = CASH_TRANSACTION_MOCK_ACCOUNTS[key];
  if (predefined) {
    return predefined;
  }

  if (!TEN_DIGIT_ACCOUNT.test(key)) {
    return null;
  }

  return buildSyntheticAccount(key);
}

export function formatCashAmount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
