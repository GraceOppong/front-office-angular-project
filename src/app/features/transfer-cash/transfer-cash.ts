import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { CashTransferStore } from '../../shared/cash-transfer.store';
import { DEFAULT_DENOMS, DenominationLine, TillStore } from '../../shared/till.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';

interface TransferRow {
  denomination: string;
  selected: boolean;
  quantity: number;
}

@Component({
  selector: 'app-transfer-cash',
  imports: [DecimalPipe, MessagePopup],
  templateUrl: './transfer-cash.html',
  styleUrl: './transfer-cash.css',
})
export class TransferCash {
  private readonly cashTransferStore = inject(CashTransferStore);
  private readonly tillStore = inject(TillStore);

  readonly closed = output<void>();
  readonly submitted = output<{ currency: string; vault: string; amount: number }>();

  readonly currencies = ['GHANA CEDIS', 'US DOLLAR', 'EURO', 'POUND STERLING'];
  readonly vaults = ['MAIN VAULT', 'BRANCH VAULT', 'HEAD OFFICE VAULT', 'ATM VAULT'];

  readonly currency = signal('');
  readonly vault = signal('');
  readonly feedbackMessage = signal('');
  readonly rows = signal<TransferRow[]>(
    DEFAULT_DENOMS.map((denom) => ({
      denomination: String(denom),
      selected: false,
      quantity: 0,
    })),
  );

  readonly showTable = computed(() => !!this.currency() && !!this.vault());

  readonly selectedLines = computed<DenominationLine[]>(() =>
    this.rows()
      .filter((row) => row.selected && row.quantity > 0)
      .map((row) => ({
        denomination: row.denomination,
        quantity: row.quantity,
        amount: row.quantity * Number(row.denomination),
      })),
  );

  readonly transferTotal = computed(() =>
    this.selectedLines().reduce((sum, line) => sum + line.amount, 0),
  );

  onCurrencyChange(value: string): void {
    this.currency.set(value);
  }

  onVaultChange(value: string): void {
    this.vault.set(value);
  }

  toggleSelected(denomination: string, checked: boolean): void {
    this.rows.update((rows) =>
      rows.map((row) =>
        row.denomination === denomination
          ? {
              ...row,
              selected: checked,
              quantity: checked ? Math.max(row.quantity, 1) : 0,
            }
          : row,
      ),
    );
  }

  onQuantityInput(denomination: string, value: string): void {
    const parsed = Number(value);
    const quantity = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    const available = this.tillStore.availableQuantity(denomination);
    const capped = Math.min(quantity, available);

    this.rows.update((rows) =>
      rows.map((row) =>
        row.denomination === denomination
          ? {
              ...row,
              selected: capped > 0 ? true : row.selected,
              quantity: capped,
            }
          : row,
      ),
    );

    if (quantity > available) {
      this.feedbackMessage.set(
        `Only ${available} notes/coins available for denomination ${denomination}.`,
      );
    }
  }

  rowAmount(row: TransferRow): number {
    return row.selected ? row.quantity * Number(row.denomination) : 0;
  }

  availableFor(denomination: string): number {
    return this.tillStore.availableQuantity(denomination);
  }

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onSubmit(): void {
    if (!this.currency()) {
      this.feedbackMessage.set('Tap to select currency.');
      return;
    }

    if (!this.vault()) {
      this.feedbackMessage.set('Select a vault first.');
      return;
    }

    const lines = this.selectedLines();
    if (lines.length === 0) {
      this.feedbackMessage.set('Select at least one denomination and enter quantity.');
      return;
    }

    const transfer = this.cashTransferStore.addAwaitingVault({
      currency: this.currency(),
      vault: this.vault(),
      lines,
      teller: 'TESTTEL',
    });

    this.submitted.emit({
      currency: transfer.currency,
      vault: transfer.vault,
      amount: transfer.total,
    });

    this.feedbackMessage.set(
      `Transfer ${transfer.batchNo} sent to vault for acceptance.`,
    );
    this.resetRows();
  }

  private resetRows(): void {
    this.rows.set(
      DEFAULT_DENOMS.map((denom) => ({
        denomination: String(denom),
        selected: false,
        quantity: 0,
      })),
    );
  }
}
