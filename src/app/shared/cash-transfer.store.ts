import { Injectable, computed, signal } from '@angular/core';
import { DenominationLine } from './till.store';

export type CashOutStatus = 'awaiting_vault' | 'pending' | 'rejected';

export interface CashOutTransfer {
  id: string;
  batchNo: string;
  currency: string;
  vault: string;
  lines: DenominationLine[];
  total: number;
  status: CashOutStatus;
  teller: string;
}

@Injectable({ providedIn: 'root' })
export class CashTransferStore {
  readonly transfers = signal<CashOutTransfer[]>([]);
  private nextBatch = 2001;

  readonly awaitingVaultTransfers = computed(() =>
    this.transfers().filter((row) => row.status === 'awaiting_vault'),
  );

  readonly pendingTransfers = computed(() =>
    this.transfers().filter((row) => row.status === 'pending'),
  );

  readonly rejectedTransfers = computed(() =>
    this.transfers().filter((row) => row.status === 'rejected'),
  );

  readonly pendingCashOut = computed(() =>
    this.pendingTransfers().reduce((sum, row) => sum + row.total, 0),
  );

  readonly pendingLines = computed(() => {
    const map = new Map<string, DenominationLine>();
    for (const transfer of this.pendingTransfers()) {
      for (const line of transfer.lines) {
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
    currency: string;
    vault: string;
    lines: DenominationLine[];
    teller?: string;
  }): CashOutTransfer {
    const total = input.lines.reduce((sum, line) => sum + line.amount, 0);
    const row: CashOutTransfer = {
      id: `out-${Date.now()}`,
      batchNo: `CO-${this.nextBatch++}`,
      currency: input.currency,
      vault: input.vault,
      lines: input.lines.map((line) => ({ ...line })),
      total,
      status: 'awaiting_vault',
      teller: input.teller ?? 'TESTTEL',
    };

    this.transfers.update((rows) => [row, ...rows]);
    return row;
  }

  acceptFromVault(id: string): boolean {
    const transfer = this.transfers().find((row) => row.id === id && row.status === 'awaiting_vault');
    if (!transfer) {
      return false;
    }

    this.transfers.update((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, status: 'pending' as const } : row,
      ),
    );
    return true;
  }

  rejectFromVault(id: string): void {
    this.transfers.update((rows) =>
      rows.map((row) =>
        row.id === id && row.status === 'awaiting_vault'
          ? { ...row, status: 'rejected' as const }
          : row,
      ),
    );
  }

  delete(id: string): void {
    this.transfers.update((rows) => rows.filter((row) => row.id !== id));
  }

  acceptAllPending(): { total: number; lines: DenominationLine[] } {
    const lines = this.pendingLines().map((line) => ({ ...line }));
    const total = this.pendingCashOut();
    this.transfers.update((rows) => rows.filter((row) => row.status !== 'pending'));
    return { total, lines };
  }

  rejectAllPending(): void {
    this.transfers.update((rows) =>
      rows.map((row) => (row.status === 'pending' ? { ...row, status: 'rejected' as const } : row)),
    );
  }
}
