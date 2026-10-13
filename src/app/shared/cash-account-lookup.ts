import {
  AccountSnapshot,
  resolveCashTransactionAccount,
} from './cash-transaction.mock';

export const ACCOUNT_NUMBER_LENGTH = 10;
export const ACCOUNT_LOOKUP_DELAY_MS = 520;

export function restrictAccountNumberInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_LENGTH);
}

export function lookupCashTransactionAccountAsync(
  accountNumber: string,
  delayMs = ACCOUNT_LOOKUP_DELAY_MS,
): Promise<AccountSnapshot | null> {
  const key = accountNumber.trim();
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(resolveCashTransactionAccount(key));
    }, delayMs);
  });
}
