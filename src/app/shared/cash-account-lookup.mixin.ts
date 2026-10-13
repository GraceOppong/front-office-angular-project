import { computed, signal, WritableSignal } from '@angular/core';
import type { AccountSnapshot } from './cash-transaction.mock';
import {
  ACCOUNT_NUMBER_LENGTH,
  lookupCashTransactionAccountAsync,
  restrictAccountNumberInput,
} from './cash-account-lookup';

/** Shared account lookup state for cash deposit / withdrawal screens. */
export function createCashAccountLookupSignals() {
  return {
    accountLookupLoading: signal(false),
    resolvedAccount: signal<AccountSnapshot | null>(null),
    loadedAccountKey: signal(''),
    showAccountInformation: signal(false),
  };
}

export type CashAccountLookupSignals = ReturnType<typeof createCashAccountLookupSignals>;

export function createCashAccountLookupHandlers(
  accountNumber: WritableSignal<string>,
  lookup: CashAccountLookupSignals,
  options: {
    onNarrationPrefill: (accountName: string) => void;
    onClearNarration: () => void;
    setFeedback: (message: string) => void;
  },
) {
  let lookupSeq = 0;

  const accountSnapshot = computed(() => {
    const key = accountNumber().trim();
    if (key.length !== ACCOUNT_NUMBER_LENGTH || key !== lookup.loadedAccountKey()) {
      return null;
    }
    return lookup.resolvedAccount();
  });

  const accountName = computed(() => accountSnapshot()?.accountName ?? '');

  function clearAccountLookup(): void {
    lookupSeq += 1;
    lookup.accountLookupLoading.set(false);
    lookup.resolvedAccount.set(null);
    lookup.loadedAccountKey.set('');
    lookup.showAccountInformation.set(false);
  }

  function onAccountNumberInput(raw: string): void {
    const digits = restrictAccountNumberInput(raw);
    accountNumber.set(digits);
    clearAccountLookup();
    options.setFeedback('');

    if (!digits) {
      options.onClearNarration();
      return;
    }

    if (digits.length === ACCOUNT_NUMBER_LENGTH) {
      void runAccountLookup(digits);
    }
  }

  async function runAccountLookup(digits: string): Promise<void> {
    const seq = ++lookupSeq;
    lookup.accountLookupLoading.set(true);
    lookup.resolvedAccount.set(null);
    lookup.loadedAccountKey.set('');
    lookup.showAccountInformation.set(false);

    const snapshot = await lookupCashTransactionAccountAsync(digits);
    if (seq !== lookupSeq || accountNumber().trim() !== digits) {
      return;
    }

    lookup.accountLookupLoading.set(false);

    if (!snapshot) {
      options.setFeedback('Enter a valid 10-digit account number.');
      return;
    }

    lookup.resolvedAccount.set(snapshot);
    lookup.loadedAccountKey.set(digits);
    lookup.showAccountInformation.set(true);
    options.onNarrationPrefill(snapshot.accountName);
    options.setFeedback('');
  }

  function onAccountNumberBlur(): void {
    const key = accountNumber().trim();
    if (!key) {
      clearAccountLookup();
      return;
    }

    if (key.length !== ACCOUNT_NUMBER_LENGTH) {
      clearAccountLookup();
      options.setFeedback('Enter a valid 10-digit account number.');
      return;
    }

    if (lookup.showAccountInformation() && lookup.loadedAccountKey() === key) {
      return;
    }

    if (!lookup.accountLookupLoading()) {
      void runAccountLookup(key);
    }
  }

  return {
    accountSnapshot,
    accountName,
    onAccountNumberInput,
    onAccountNumberBlur,
  };
}
