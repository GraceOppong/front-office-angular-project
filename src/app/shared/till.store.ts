import { Injectable, computed, signal } from '@angular/core';

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

export const DEFAULT_DENOMS = [200, 100, 50, 20, 10, 5, 2, 1];

@Injectable({ providedIn: 'root' })
export class TillStore {
  readonly tillRows = signal<TillRow[]>([
    { denomination: '200', amount: 40000, quantity: 200 },
    { denomination: '100', amount: 25000, quantity: 250 },
    { denomination: '50', amount: 12500, quantity: 250 },
    { denomination: '20', amount: 8000, quantity: 400 },
    { denomination: '10', amount: 3500, quantity: 350 },
    { denomination: '5', amount: 1250, quantity: 250 },
    { denomination: '2', amount: 400, quantity: 200 },
    { denomination: '1', amount: 150, quantity: 150 },
  ]);

  readonly cashReceived = signal(201545);
  readonly cashSent = signal(45200);
  readonly cashReceivedLines = signal<DenominationLine[]>([]);
  readonly cashSentLines = signal<DenominationLine[]>([]);

  readonly tillTotal = computed(() =>
    this.tillRows().reduce((sum, row) => sum + row.amount, 0),
  );

  constructor() {
    this.cashReceivedLines.set(this.breakIntoDenominations(this.cashReceived()));
    this.cashSentLines.set(this.breakIntoDenominations(this.cashSent()));
  }

  breakIntoDenominations(total: number, denominationCount = 4): DenominationLine[] {
    let remaining = Math.round(Number(total));
    if (!Number.isFinite(remaining) || remaining <= 0) {
      return [];
    }

    const usableDenoms = DEFAULT_DENOMS.filter((denom) => denom <= remaining);
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

    for (const denom of DEFAULT_DENOMS) {
      if (remaining <= 0) {
        break;
      }
      const quantity = Math.floor(remaining / denom);
      addLine(denom, quantity);
    }

    return DEFAULT_DENOMS.map((denom) => lineMap.get(String(denom))).filter(
      (line): line is DenominationLine => !!line && line.quantity > 0,
    );
  }

  applyDenominationLines(lines: DenominationLine[]): void {
    this.tillRows.update((rows) => {
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

      return DEFAULT_DENOMS.map((denom) => map.get(String(denom))).filter(
        (row): row is TillRow => !!row && row.quantity > 0,
      );
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

  removeDenominationLines(lines: DenominationLine[]): void {
    this.tillRows.update((rows) => {
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

      return DEFAULT_DENOMS.map((denom) => map.get(String(denom))).filter(
        (row): row is TillRow => !!row && row.quantity > 0,
      );
    });
  }

  availableQuantity(denomination: string): number {
    return this.tillRows().find((row) => row.denomination === denomination)?.quantity ?? 0;
  }

  private mergeLines(current: DenominationLine[], incoming: DenominationLine[]): DenominationLine[] {
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

    return DEFAULT_DENOMS.map((denom) => map.get(String(denom))).filter(
      (line): line is DenominationLine => !!line && line.quantity > 0,
    );
  }
}
