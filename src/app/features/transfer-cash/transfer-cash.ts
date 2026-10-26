import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { CashTransferStore } from '../../shared/cash-transfer.store';
import { denomsForCurrency } from '../../shared/currency-denominations';
import { DenominationLine, TillStore } from '../../shared/till.store';
import { WorkspaceCurrencyStore } from '../../shared/workspace-currency.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';
import { DenominationDescriptionPipe } from '../../shared/denomination-description.pipe';
import { FieldLabel } from '../../shared/field-label/field-label';
import {
  amountDraftFromQuantity,
  parseWholeAmountInput,
  quantityFromEnteredAmount,
} from '../../shared/cash-denomination.helpers';

interface TransferRow {
  denomination: string;
  selected: boolean;
  quantity: number;
  amountDraft: string;
}

@Component({
  selector: 'app-transfer-cash',
  imports: [DecimalPipe, MessagePopup, DenominationDescriptionPipe, FieldLabel],
  templateUrl: './transfer-cash.html',
  styleUrl: './transfer-cash.css',
})
export class TransferCash {
  private readonly cashTransferStore = inject(CashTransferStore);
  private readonly tillStore = inject(TillStore);
  readonly currencyStore = inject(WorkspaceCurrencyStore);

  readonly closed = output<void>();
  readonly submitted = output<{ currency: string; vault: string; amount: number }>();

  readonly vaults = ['MAIN VAULT', 'BRANCH VAULT', 'HEAD OFFICE VAULT', 'ATM VAULT'];

  readonly vault = signal('');
  readonly feedbackMessage = signal('');

  readonly rows = signal<TransferRow[]>([]);

  constructor() {
    effect(() => {
      const currency = this.currencyStore.selectedCurrency();
      this.resetRowsForCurrency(currency);
    });
  }

  readonly showTable = computed(() => !!this.currencyStore.selectedCurrency() && !!this.vault());

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
    this.currencyStore.setCurrency(value);
    this.resetRowsForCurrency(value);
  }

  onVaultChange(value: string): void {
    this.vault.set(value);
  }

  toggleSelected(denomination: string, checked: boolean): void {
    this.rows.update((rows) =>
      rows.map((row) => {
        if (row.denomination !== denomination) {
          return row;
        }
        return {
          ...row,
          selected: checked,
          quantity: checked ? row.quantity : 0,
          amountDraft: checked ? row.amountDraft : '',
        };
      }),
    );
  }

  onAmountInput(denomination: string, value: string): void {
    const digits = value.replace(/\D/g, '');
    const enteredAmount = parseWholeAmountInput(digits);
    const denomValue = Number(denomination);
    const available = this.tillStore.availableQuantity(denomination);
    const uncapped = quantityFromEnteredAmount(enteredAmount, denomValue);
    const quantity = quantityFromEnteredAmount(enteredAmount, denomValue, available);

    this.rows.update((rows) =>
      rows.map((row) =>
        row.denomination === denomination
          ? {
              ...row,
              selected: quantity > 0 ? true : row.selected,
              quantity,
              amountDraft: digits,
            }
          : row,
      ),
    );

    if (uncapped > available) {
      this.feedbackMessage.set(
        `Only ${available} notes/coins available for denomination ${denomination}.`,
      );
    }
  }

  onAmountBlur(denomination: string): void {
    this.rows.update((rows) =>
      rows.map((row) =>
        row.denomination === denomination
          ? {
              ...row,
              amountDraft: amountDraftFromQuantity(row.quantity, Number(row.denomination)),
            }
          : row,
      ),
    );
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
    if (!this.currencyStore.selectedCurrency()) {
      this.feedbackMessage.set('Tap to select currency.');
      return;
    }

    if (!this.vault()) {
      this.feedbackMessage.set('Select a vault first.');
      return;
    }

    const lines = this.selectedLines();
    if (lines.length === 0) {
      this.feedbackMessage.set('Select at least one denomination and enter amount.');
      return;
    }

    if (!this.tillStore.canRemoveLines(lines)) {
      this.feedbackMessage.set('Till does not have enough notes/coins for this transfer.');
      return;
    }

    const transfer = this.cashTransferStore.addAwaitingVault({
      currency: this.currencyStore.selectedCurrency(),
      vault: this.vault(),
      lines,
      teller: 'TESTTEL',
    });

    this.tillStore.removeDenominationLines(lines);
    this.tillStore.recordVaultCashSent(transfer.total);

    this.submitted.emit({
      currency: transfer.currency,
      vault: transfer.vault,
      amount: transfer.total,
    });

    this.resetRows();
    this.closed.emit();
  }

  private resetRows(): void {
    this.resetRowsForCurrency(this.currencyStore.selectedCurrency());
  }

  private resetRowsForCurrency(currency: string): void {
    const denoms = currency ? denomsForCurrency(currency) : [];
    this.rows.set(
      denoms.map((denom) => ({
        denomination: String(denom),
        selected: false,
        quantity: 0,
        amountDraft: '',
      })),
    );
  }
}
