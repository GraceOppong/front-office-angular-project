import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_DENOMS, type DenominationLine, type TillRow } from './till.store';

export interface VaultMovement {
  id: string;
  type: 'ISSUE' | 'RECEIVE' | 'SEAL' | 'OPEN';
  teller: string;
  reference: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Rejected';
  time: string;
}

@Injectable({ providedIn: 'root' })
export class VaultStore {
  readonly vaultRows = signal<TillRow[]>([
    { denomination: '200', amount: 400000, quantity: 2000 },
    { denomination: '100', amount: 350000, quantity: 3500 },
    { denomination: '50', amount: 175000, quantity: 3500 },
    { denomination: '20', amount: 80000, quantity: 4000 },
    { denomination: '10', amount: 40000, quantity: 4000 },
    { denomination: '5', amount: 15000, quantity: 3000 },
    { denomination: '2', amount: 4000, quantity: 2000 },
    { denomination: '1', amount: 1500, quantity: 1500 },
  ]);

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

  applyLines(lines: DenominationLine[], direction: 'in' | 'out'): void {
    this.vaultRows.update((rows) => {
      const map = new Map(rows.map((row) => [row.denomination, { ...row }]));

      for (const line of lines) {
        const existing = map.get(line.denomination) ?? {
          denomination: line.denomination,
          quantity: 0,
          amount: 0,
        };
        const qtyDelta = direction === 'in' ? line.quantity : -line.quantity;
        existing.quantity = Math.max(0, existing.quantity + qtyDelta);
        existing.amount = existing.quantity * Number(existing.denomination);
        if (existing.quantity === 0) {
          map.delete(line.denomination);
        } else {
          map.set(line.denomination, existing);
        }
      }

      return DEFAULT_DENOMS.map((denom) => map.get(String(denom))).filter(
        (row): row is TillRow => !!row && row.quantity > 0,
      );
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
