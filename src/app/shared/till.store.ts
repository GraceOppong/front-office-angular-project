import { computed, inject, Injectable, signal } from '@angular/core';
import {
  denomsForCurrency,
  normalizeTillRows,
  tillSeedForCurrency,
} from './currency-denominations';
import { WORKSPACE_CURRENCIES, WorkspaceCurrencyStore } from './workspace-currency.store';

export interface TillRow {
  denomination: string;
  amount: number;
  quantity: number;
}

export interface DenominationLine {
  denomination: string;
  quantity: number;
  amount: number;
}

/** Ghana cedi default denomination order (legacy helpers). */
export const DEFAULT_DENOMS = denomsForCurrency('GHANA CEDIS');

function buildInitialTillByCurrency(): Record<string, TillRow[]> {
  const map: Record<string, TillRow[]> = {};
  for (const currency of WORKSPACE_CURRENCIES) {
    map[currency] = tillSeedForCurrency(currency);
  }
  return map;
}

@Injectable({ providedIn: 'root' })
export class TillStore {
  private readonly currencyStore = inject(WorkspaceCurrencyStore);

  private readonly tillByCurrency = signal<Record<string, TillRow[]>>(buildInitialTillByCurrency());

  readonly tillRows = computed(() => {
    const currency = this.currencyStore.selectedCurrency();
    if (!currency) {
      return [];
    }
    return this.tillByCurrency()[currency] ?? [];
  });

  readonly cashReceived = signal(201545);
  readonly cashSent = signal(45200);
  readonly cashReceivedTarget = signal(180000);
  readonly cashSentTarget = signal(60000);
  readonly cashLimit = signal(150000);

  readonly cashDeposited = signal(156345);
  readonly cashDepositedCount = signal(42);
  readonly cashDepositedTarget = signal(180000);
  readonly cashDepositedCountTarget = signal(50);

  readonly cashWithdrawn = signal(38200);
  readonly cashWithdrawnCount = signal(35);
  readonly cashWithdrawnTarget = signal(60000);
  readonly cashWithdrawnCountTarget = signal(40);

  readonly vaultCashReceived = signal(45200);
  readonly vaultCashReceivedCount = signal(2);
  readonly vaultCashSent = signal(7000);
  readonly vaultCashSentCount = signal(1);
  readonly cashReceivedLines = signal<DenominationLine[]>([]);
  readonly cashSentLines = signal<DenominationLine[]>([]);

  readonly tillTotal = computed(() =>
    this.tillRows().reduce((sum, row) => sum + row.amount, 0),
  );

  constructor() {
    this.cashReceivedLines.set(this.breakIntoDenominations(this.cashReceived()));
    this.cashSentLines.set(this.breakIntoDenominations(this.cashSent()));
  }

  breakIntoDenominations(
    total: number,
    denominationCount = 4,
    currency = this.currencyStore.selectedCurrency() || 'GHANA CEDIS',
  ): DenominationLine[] {
    let remaining = Math.round(Number(total));
    if (!Number.isFinite(remaining) || remaining <= 0) {
      return [];
    }

    const denomOrder = denomsForCurrency(currency);
    const usableDenoms = denomOrder.filter((denom) => denom <= remaining);
    if (usableDenoms.length === 0) {
      return [];
    }

    const selected = usableDenoms.slice(0, Math.min(denominationCount, usableDenoms.length));
    const lineMap = new Map<string, DenominationLine>();
    const share = Math.floor(remaining / selected.length);

    const addLine = (denom: number, quantity: number): void => {
      if (quantity <= 0) {
        return;
      }
      const key = String(denom);
      const amount = quantity * denom;
      const existing = lineMap.get(key);
      if (existing) {
        existing.quantity += quantity;
        existing.amount += amount;
      } else {
        lineMap.set(key, { denomination: key, quantity, amount });
      }
      remaining -= amount;
    };

    for (let i = 0; i < selected.length; i++) {
      const denom = selected[i];
      const isLast = i === selected.length - 1;
      const target = isLast ? remaining : Math.min(share, remaining);
      let quantity = Math.floor(target / denom);
      if (quantity < 1 && remaining >= denom) {
        quantity = 1;
      }
      addLine(denom, quantity);
    }

    for (const denom of denomOrder) {
      if (remaining <= 0) {
        break;
      }
      const quantity = Math.floor(remaining / denom);
      addLine(denom, quantity);
    }

    return denomOrder
      .map((denom) => lineMap.get(String(denom)))
      .filter((line): line is DenominationLine => !!line && line.quantity > 0);
  }

  applyDenominationLines(lines: DenominationLine[]): void {
    this.updateCurrentTillRows((rows) => {
      const map = new Map(rows.map((row) => [row.denomination, { ...row }]));

      for (const line of lines) {
        const existing = map.get(line.denomination);
        if (existing) {
          existing.quantity += line.quantity;
          existing.amount += line.amount;
        } else {
          map.set(line.denomination, {
            denomination: line.denomination,
            quantity: line.quantity,
            amount: line.amount,
          });
        }
      }

      return Array.from(map.values());
    });
  }

  addCashReceived(amount: number, lines: DenominationLine[] = []): void {
    this.cashReceived.update((current) => current + amount);
    if (lines.length) {
      this.cashReceivedLines.update((current) => this.mergeLines(current, lines));
    }
  }

  addCashSent(amount: number, lines: DenominationLine[] = []): void {
    this.cashSent.update((current) => current + amount);
    if (lines.length) {
      this.cashSentLines.update((current) => this.mergeLines(current, lines));
    }
  }

  recordCustomerDeposit(amount: number): void {
    const value = Math.abs(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    this.cashDeposited.update((current) => current + value);
    this.cashDepositedCount.update((current) => current + 1);
  }

  recordCustomerWithdrawal(amount: number): void {
    const value = Math.abs(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    this.cashWithdrawn.update((current) => current + value);
    this.cashWithdrawnCount.update((current) => current + 1);
  }

  recordVaultCashReceived(amount: number): void {
    const value = Math.abs(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    this.vaultCashReceived.update((current) => current + value);
    this.vaultCashReceivedCount.update((current) => current + 1);
  }

  recordVaultCashSent(amount: number): void {
    const value = Math.abs(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    this.vaultCashSent.update((current) => current + value);
    this.vaultCashSentCount.update((current) => current + 1);
  }

  removeDenominationLines(lines: DenominationLine[]): void {
    this.updateCurrentTillRows((rows) => {
      const map = new Map(rows.map((row) => [row.denomination, { ...row }]));

      for (const line of lines) {
        const existing = map.get(line.denomination);
        if (!existing) {
          continue;
        }
        existing.quantity = Math.max(0, existing.quantity - line.quantity);
        existing.amount = existing.quantity * Number(existing.denomination);
        if (existing.quantity === 0) {
          map.delete(line.denomination);
        } else {
          map.set(line.denomination, existing);
        }
      }

      return Array.from(map.values());
    });
  }

  availableQuantity(denomination: string): number {
    return this.tillRows().find((row) => row.denomination === denomination)?.quantity ?? 0;
  }

  canRemoveLines(lines: DenominationLine[]): boolean {
    return lines.every((line) => this.availableQuantity(line.denomination) >= line.quantity);
  }

  private updateCurrentTillRows(updater: (rows: TillRow[]) => TillRow[]): void {
    const currency = this.currencyStore.selectedCurrency();
    if (!currency) {
      return;
    }
    this.tillByCurrency.update((map) => ({
      ...map,
      [currency]: normalizeTillRows(updater(map[currency] ?? []), currency),
    }));
  }

  private mergeLines(current: DenominationLine[], incoming: DenominationLine[]): DenominationLine[] {
    const currency = this.currencyStore.selectedCurrency() || 'GHANA CEDIS';
    const map = new Map(current.map((line) => [line.denomination, { ...line }]));

    for (const line of incoming) {
      const existing = map.get(line.denomination);
      if (existing) {
        existing.quantity += line.quantity;
        existing.amount += line.amount;
      } else {
        map.set(line.denomination, { ...line });
      }
    }

    const denomOrder = denomsForCurrency(currency);
    return denomOrder
      .map((denom) => map.get(String(denom)))
      .filter((line): line is DenominationLine => !!line && line.quantity > 0);
  }
}
