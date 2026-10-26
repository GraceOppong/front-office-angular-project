import { computed, inject, Injectable, signal } from '@angular/core';
import { normalizeTillRows, vaultSeedForCurrency } from './currency-denominations';
import type { DenominationLine, TillRow } from './till.store';
import { WORKSPACE_CURRENCIES, WorkspaceCurrencyStore } from './workspace-currency.store';

export interface VaultMovement {
  id: string;
  type: 'ISSUE' | 'RECEIVE' | 'SEAL' | 'OPEN';
  teller: string;
  reference: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Rejected';
  time: string;
}

function buildInitialVaultByCurrency(): Record<string, TillRow[]> {
  const map: Record<string, TillRow[]> = {};
  for (const currency of WORKSPACE_CURRENCIES) {
    map[currency] = vaultSeedForCurrency(currency);
  }
  return map;
}

@Injectable({ providedIn: 'root' })
export class VaultStore {
  private readonly currencyStore = inject(WorkspaceCurrencyStore);

  private readonly vaultByCurrency = signal<Record<string, TillRow[]>>(buildInitialVaultByCurrency());

  readonly vaultRows = computed(() => {
    const currency = this.currencyStore.selectedCurrency();
    if (!currency) {
      return [];
    }
    return this.vaultByCurrency()[currency] ?? [];
  });

  readonly openingBalance = signal(1_065_500);
  readonly issuedToday = signal(285_400);
  readonly receivedToday = signal(142_750);
  readonly sealedBags = signal(12);

  readonly movements = signal<VaultMovement[]>([]);

  readonly vaultTotal = computed(() =>
    this.vaultRows().reduce((sum, row) => sum + row.amount, 0),
  );

  readonly closingPosition = computed(
    () => this.openingBalance() - this.issuedToday() + this.receivedToday(),
  );

  availableQuantity(denomination: string): number {
    return this.vaultRows().find((row) => row.denomination === denomination)?.quantity ?? 0;
  }

  applyLines(lines: DenominationLine[], direction: 'in' | 'out', currency?: string): void {
    const activeCurrency = currency || this.currencyStore.selectedCurrency();
    if (!activeCurrency) {
      return;
    }
    this.vaultByCurrency.update((map) => {
      const rows = map[activeCurrency] ?? [];
      const rowMap = new Map(rows.map((row) => [row.denomination, { ...row }]));

      for (const line of lines) {
        const existing = rowMap.get(line.denomination) ?? {
          denomination: line.denomination,
          quantity: 0,
          amount: 0,
        };
        const qtyDelta = direction === 'in' ? line.quantity : -line.quantity;
        existing.quantity = Math.max(0, existing.quantity + qtyDelta);
        existing.amount = existing.quantity * Number(existing.denomination);
        if (existing.quantity === 0) {
          rowMap.delete(line.denomination);
        } else {
          rowMap.set(line.denomination, existing);
        }
      }

      return {
        ...map,
        [activeCurrency]: normalizeTillRows(Array.from(rowMap.values()), activeCurrency),
      };
    });
  }

  canIssue(lines: DenominationLine[]): boolean {
    return lines.every((line) => this.availableQuantity(line.denomination) >= line.quantity);
  }

  recordIssue(reference: string, teller: string, amount: number, lines: DenominationLine[]): void {
    this.applyLines(lines, 'out');
    this.issuedToday.update((current) => current + amount);
    this.prependMovement({
      type: 'ISSUE',
      teller,
      reference,
      amount,
      status: 'Completed',
    });
  }

  recordReceive(reference: string, teller: string, amount: number, lines: DenominationLine[]): void {
    this.applyLines(lines, 'in');
    this.receivedToday.update((current) => current + amount);
    this.prependMovement({
      type: 'RECEIVE',
      teller,
      reference,
      amount,
      status: 'Completed',
    });
  }

  private prependMovement(
    input: Omit<VaultMovement, 'id' | 'time'> & { status?: VaultMovement['status'] },
  ): void {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.movements.update((rows) => [
      {
        id: `mv-${Date.now()}`,
        type: input.type,
        teller: input.teller,
        reference: input.reference,
        amount: input.amount,
        status: input.status ?? 'Completed',
        time,
      },
      ...rows,
    ]);
  }
}
