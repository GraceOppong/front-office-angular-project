import type { TillRow } from './till.store';
import { WORKSPACE_CURRENCIES, type WorkspaceCurrency } from './workspace-currency.store';

export type CurrencyDenomConfig = {
  denoms: number[];
  descriptions: Record<string, string>;
  tillSeed: TillRow[];
  vaultSeed: TillRow[];
};

const GHS_CONFIG: CurrencyDenomConfig = {
  denoms: [200, 100, 50, 20, 10, 5, 2, 1],
  descriptions: {
    '200': 'Two Hundred Cedis',
    '100': 'One Hundred Cedis',
    '50': 'Fifty Cedis',
    '20': 'Twenty Cedis',
    '10': 'Ten Cedis',
    '5': 'Five Cedis',
    '2': 'Two Cedis',
    '1': 'One Cedi',
  },
  vaultSeed: [
    { denomination: '200', amount: 400000, quantity: 2000 },
    { denomination: '100', amount: 350000, quantity: 3500 },
    { denomination: '50', amount: 175000, quantity: 3500 },
    { denomination: '20', amount: 80000, quantity: 4000 },
    { denomination: '10', amount: 40000, quantity: 4000 },
    { denomination: '5', amount: 15000, quantity: 3000 },
    { denomination: '2', amount: 4000, quantity: 2000 },
    { denomination: '1', amount: 1500, quantity: 1500 },
  ],
  tillSeed: [
    { denomination: '200', amount: 40000, quantity: 200 },
    { denomination: '100', amount: 25000, quantity: 250 },
    { denomination: '50', amount: 12500, quantity: 250 },
    { denomination: '20', amount: 8000, quantity: 400 },
    { denomination: '10', amount: 3500, quantity: 350 },
    { denomination: '5', amount: 1250, quantity: 250 },
    { denomination: '2', amount: 400, quantity: 200 },
    { denomination: '1', amount: 150, quantity: 150 },
  ],
};

const USD_CONFIG: CurrencyDenomConfig = {
  denoms: [100, 50, 20, 10, 5, 2, 1],
  descriptions: {
    '100': 'One Hundred Dollars',
    '50': 'Fifty Dollars',
    '20': 'Twenty Dollars',
    '10': 'Ten Dollars',
    '5': 'Five Dollars',
    '2': 'Two Dollars',
    '1': 'One Dollar',
  },
  vaultSeed: [
    { denomination: '100', amount: 250000, quantity: 2500 },
    { denomination: '50', amount: 125000, quantity: 2500 },
    { denomination: '20', amount: 80000, quantity: 4000 },
    { denomination: '10', amount: 35000, quantity: 3500 },
    { denomination: '5', amount: 10000, quantity: 2000 },
    { denomination: '2', amount: 4000, quantity: 2000 },
    { denomination: '1', amount: 2500, quantity: 2500 },
  ],
  tillSeed: [
    { denomination: '100', amount: 15000, quantity: 150 },
    { denomination: '50', amount: 7500, quantity: 150 },
    { denomination: '20', amount: 6000, quantity: 300 },
    { denomination: '10', amount: 2500, quantity: 250 },
    { denomination: '5', amount: 500, quantity: 100 },
    { denomination: '2', amount: 200, quantity: 100 },
    { denomination: '1', amount: 85, quantity: 85 },
  ],
};

const EUR_CONFIG: CurrencyDenomConfig = {
  denoms: [200, 100, 50, 20, 10, 5, 2, 1],
  descriptions: {
    '200': 'Two Hundred Euro',
    '100': 'One Hundred Euro',
    '50': 'Fifty Euro',
    '20': 'Twenty Euro',
    '10': 'Ten Euro',
    '5': 'Five Euro',
    '2': 'Two Euro',
    '1': 'One Euro',
  },
  vaultSeed: [
    { denomination: '200', amount: 240000, quantity: 1200 },
    { denomination: '100', amount: 280000, quantity: 2800 },
    { denomination: '50', amount: 150000, quantity: 3000 },
    { denomination: '20', amount: 72000, quantity: 3600 },
    { denomination: '10', amount: 28000, quantity: 2800 },
    { denomination: '5', amount: 10000, quantity: 2000 },
    { denomination: '2', amount: 4000, quantity: 2000 },
    { denomination: '1', amount: 2000, quantity: 2000 },
  ],
  tillSeed: [
    { denomination: '200', amount: 12000, quantity: 60 },
    { denomination: '100', amount: 18000, quantity: 180 },
    { denomination: '50', amount: 10000, quantity: 200 },
    { denomination: '20', amount: 6400, quantity: 320 },
    { denomination: '10', amount: 2100, quantity: 210 },
    { denomination: '5', amount: 750, quantity: 150 },
    { denomination: '2', amount: 240, quantity: 120 },
    { denomination: '1', amount: 95, quantity: 95 },
  ],
};

const GBP_CONFIG: CurrencyDenomConfig = {
  denoms: [50, 20, 10, 5, 2, 1],
  descriptions: {
    '50': 'Fifty Pounds',
    '20': 'Twenty Pounds',
    '10': 'Ten Pounds',
    '5': 'Five Pounds',
    '2': 'Two Pounds',
    '1': 'One Pound',
  },
  vaultSeed: [
    { denomination: '50', amount: 200000, quantity: 4000 },
    { denomination: '20', amount: 120000, quantity: 6000 },
    { denomination: '10', amount: 45000, quantity: 4500 },
    { denomination: '5', amount: 15000, quantity: 3000 },
    { denomination: '2', amount: 6000, quantity: 3000 },
    { denomination: '1', amount: 3000, quantity: 3000 },
  ],
  tillSeed: [
    { denomination: '50', amount: 10000, quantity: 200 },
    { denomination: '20', amount: 8000, quantity: 400 },
    { denomination: '10', amount: 3500, quantity: 350 },
    { denomination: '5', amount: 1250, quantity: 250 },
    { denomination: '2', amount: 400, quantity: 200 },
    { denomination: '1', amount: 120, quantity: 120 },
  ],
};

export const CURRENCY_DENOM_CONFIG: Record<WorkspaceCurrency, CurrencyDenomConfig> = {
  'GHANA CEDIS': GHS_CONFIG,
  'US DOLLAR': USD_CONFIG,
  EURO: EUR_CONFIG,
  'POUND STERLING': GBP_CONFIG,
};

export function isWorkspaceCurrency(value: string): value is WorkspaceCurrency {
  return (WORKSPACE_CURRENCIES as readonly string[]).includes(value);
}

export function getCurrencyDenomConfig(currency: string): CurrencyDenomConfig | null {
  if (!isWorkspaceCurrency(currency)) {
    return null;
  }
  return CURRENCY_DENOM_CONFIG[currency];
}

export function denomsForCurrency(currency: string): number[] {
  return getCurrencyDenomConfig(currency)?.denoms ?? GHS_CONFIG.denoms;
}

export function tillSeedForCurrency(currency: string): TillRow[] {
  const seed = getCurrencyDenomConfig(currency)?.tillSeed ?? GHS_CONFIG.tillSeed;
  return seed.map((row) => ({ ...row }));
}

export function vaultSeedForCurrency(currency: string): TillRow[] {
  const seed = getCurrencyDenomConfig(currency)?.vaultSeed ?? GHS_CONFIG.vaultSeed;
  return seed.map((row) => ({ ...row }));
}

export function denominationDescriptionFor(value: string, currency?: string | null): string {
  const key = value?.trim() ?? '';
  if (!key) {
    return '';
  }
  if (currency && isWorkspaceCurrency(currency)) {
    const label = CURRENCY_DENOM_CONFIG[currency].descriptions[key];
    if (label) {
      return label;
    }
  }
  return GHS_CONFIG.descriptions[key] ?? key;
}

export function sortTillRowsByCurrency(rows: TillRow[], currency: string): TillRow[] {
  const order = denomsForCurrency(currency).map(String);
  const rank = new Map(order.map((denom, index) => [denom, index]));
  return [...rows].sort(
    (a, b) => (rank.get(a.denomination) ?? 999) - (rank.get(b.denomination) ?? 999),
  );
}

export function normalizeTillRows(rows: TillRow[], currency: string): TillRow[] {
  const order = denomsForCurrency(currency).map(String);
  const map = new Map(rows.map((row) => [row.denomination, row]));
  return order
    .map((denom) => map.get(denom))
    .filter((row): row is TillRow => !!row && row.quantity > 0);
}
