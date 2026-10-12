import { Injectable, computed, signal } from '@angular/core';
import { DenominationLine } from './till.store';

export type CashRequestStatus = 'awaiting_vault' | 'pending' | 'rejected';

export interface CashRequestRow {
  id: string;
  batchNo: string;
  transAmount: number;
  transTo: string;
  currency: string;
  status: CashRequestStatus;
  teller: string;
  lines: DenominationLine[];
}

@Injectable({ providedIn: 'root' })
export class CashRequestStore {
  readonly requests = signal<CashRequestRow[]>([]);
  private nextBatch = 1001;

  readonly awaitingVaultRequests = computed(() =>
    this.requests().filter((row) => row.status === 'awaiting_vault'),
  );

  readonly pendingRequests = computed(() =>
    this.requests().filter((row) => row.status === 'pending'),
  );

  readonly rejectedRequests = computed(() =>
    this.requests().filter((row) => row.status === 'rejected'),
  );

  readonly pendingCashIn = computed(() =>
    this.pendingRequests().reduce((sum, row) => sum + row.transAmount, 0),
  );

  readonly ungrantedTotal = computed(() =>
    this.awaitingVaultRequests().reduce((sum, row) => sum + row.transAmount, 0),
  );

  readonly pendingLines = computed(() => {
    const map = new Map<string, DenominationLine>();
    for (const request of this.pendingRequests()) {
      for (const line of request.lines) {
        const existing = map.get(line.denomination);
        if (existing) {
          existing.quantity += line.quantity;
          existing.amount += line.amount;
        } else {
          map.set(line.denomination, { ...line });
        }
      }
    }
    return [...map.values()].sort((a, b) => Number(b.denomination) - Number(a.denomination));
  });

  addAwaitingVault(input: {
    amount: number;
    currency: string;
    requestingFrom: string;
    teller?: string;
  }): CashRequestRow {
    const row: CashRequestRow = {
      id: `req-${Date.now()}`,
      batchNo: `CR-${this.nextBatch++}`,
      transAmount: input.amount,
      transTo: input.requestingFrom,
      currency: input.currency,
      status: 'awaiting_vault',
      teller: input.teller ?? 'TESTTEL',
      lines: [],
    };

    this.requests.update((rows) => [row, ...rows]);
    return row;
  }

  issueFromVault(id: string, lines: DenominationLine[]): boolean {
    const request = this.requests().find((row) => row.id === id && row.status === 'awaiting_vault');
    if (!request) {
      return false;
    }

    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    if (total !== request.transAmount) {
      return false;
    }

    this.requests.update((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              status: 'pending' as const,
              lines: lines.map((line) => ({ ...line })),
            }
          : row,
      ),
    );
    return true;
  }

  rejectFromVault(id: string): void {
    this.requests.update((rows) =>
      rows.map((row) =>
        row.id === id && row.status === 'awaiting_vault'
          ? { ...row, status: 'rejected' as const, lines: [] }
          : row,
      ),
    );
  }

  delete(id: string): void {
    this.requests.update((rows) => rows.filter((row) => row.id !== id));
  }

  acknowledgeRejected(id: string): void {
    this.delete(id);
  }

  acceptAllPending(): { total: number; lines: DenominationLine[] } {
    const lines = this.pendingLines().map((line) => ({ ...line }));
    const total = this.pendingCashIn();
    this.requests.update((rows) => rows.filter((row) => row.status !== 'pending'));
    return { total, lines };
  }

  rejectAllPending(): void {
    this.requests.update((rows) =>
      rows.map((row) => (row.status === 'pending' ? { ...row, status: 'rejected' as const } : row)),
    );
  }
}
