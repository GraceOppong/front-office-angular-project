import { Injectable, signal } from '@angular/core';

export const WORKSPACE_CURRENCIES = [
  'GHANA CEDIS',
  'US DOLLAR',
  'EURO',
  'POUND STERLING',
] as const;

export type WorkspaceCurrency = (typeof WORKSPACE_CURRENCIES)[number];

const CURRENCY_CODES: Record<string, string> = {
  'GHANA CEDIS': 'GHS',
  'US DOLLAR': 'USD',
  EURO: 'EUR',
  'POUND STERLING': 'GBP',
};

export function toCurrencyCode(value: string | null | undefined): string {
  const key = value?.trim() ?? '';
  if (!key) {
    return '';
  }
  return CURRENCY_CODES[key] ?? key;
}

const STORAGE_KEY = 'front-office.workspaceCurrency';

function readStoredCurrency(): string {
  if (typeof sessionStorage === 'undefined') {
    return '';
  }
  const stored = sessionStorage.getItem(STORAGE_KEY)?.trim() ?? '';
  if (!stored) {
    return '';
  }
  return (WORKSPACE_CURRENCIES as readonly string[]).includes(stored) ? stored : '';
}

@Injectable({ providedIn: 'root' })
export class WorkspaceCurrencyStore {
  readonly currencies = WORKSPACE_CURRENCIES;

  readonly selectedCurrency = signal(readStoredCurrency());

  setCurrency(value: string): void {
    const trimmed = value.trim();
    const next = (WORKSPACE_CURRENCIES as readonly string[]).includes(trimmed) ? trimmed : '';
    this.selectedCurrency.set(next);
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    if (next) {
      sessionStorage.setItem(STORAGE_KEY, next);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Apply route/deep-link currency if valid; returns whether it was applied. */
  applyFromQueryParam(value: string | null | undefined): boolean {
    const trimmed = value?.trim() ?? '';
    if (!trimmed || !(WORKSPACE_CURRENCIES as readonly string[]).includes(trimmed)) {
      return false;
    }
    this.setCurrency(trimmed);
    return true;
  }
}
