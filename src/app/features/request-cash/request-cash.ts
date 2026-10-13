import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import {
  formatAmountOnBlur,
  formatAmountInput,
  parseAmountInput,
  restrictAmountTyping,
} from '../../shared/amount-input';
import { CashRequestStore } from '../../shared/cash-request.store';
import { WorkspaceCurrencyStore } from '../../shared/workspace-currency.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';

interface RequestFromOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-request-cash',
  imports: [DecimalPipe, MessagePopup],
  templateUrl: './request-cash.html',
  styleUrl: './request-cash.css',
})
export class RequestCash {
  private readonly cashRequestStore = inject(CashRequestStore);
  readonly currencyStore = inject(WorkspaceCurrencyStore);

  readonly closed = output<void>();
  readonly submitted = output<{ currency: string; amount: string; requestingFrom: string }>();

  readonly requestFromOptions: RequestFromOption[] = [
    { id: '102893', name: 'VAULT CUSTODIAN' },
    { id: '102890', name: 'HENRY AMOH' },
    { id: '102891', name: 'AMA MENSAH' },
    { id: '102892', name: 'KOFI OWUSU' },
  ];

  readonly amount = signal('');
  readonly requestingFromId = signal(this.requestFromOptions[0].id);
  readonly feedbackMessage = signal('');

  readonly awaitingVaultRequests = this.cashRequestStore.awaitingVaultRequests;
  readonly rejectedRequests = this.cashRequestStore.rejectedRequests;

  readonly showRejectedTable = computed(() => this.rejectedRequests().length > 0);

  onCurrencyChange(value: string): void {
    this.currencyStore.setCurrency(value);
  }

  onRequestingFromChange(value: string): void {
    this.requestingFromId.set(value);
  }

  onAmountInput(value: string): void {
    this.amount.set(restrictAmountTyping(value));
  }

  onAmountBlur(): void {
    this.amount.set(formatAmountOnBlur(this.amount()));
  }

  deletePending(id: string): void {
    this.cashRequestStore.delete(id);
  }

  acknowledgeRejected(id: string): void {
    this.cashRequestStore.acknowledgeRejected(id);
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

    const value = this.amount().trim();
    if (!value) {
      this.feedbackMessage.set('Enter an amount before submitting.');
      return;
    }

    const amountNumber = parseAmountInput(value);
    if (amountNumber === null || amountNumber <= 0) {
      this.feedbackMessage.set('Enter a valid amount greater than zero.');
      return;
    }

    const from =
      this.requestFromOptions.find((item) => item.id === this.requestingFromId())?.name ?? '';

    this.cashRequestStore.addAwaitingVault({
      amount: amountNumber,
      currency: this.currencyStore.selectedCurrency(),
      requestingFrom: from,
      teller: 'TESTTEL',
    });

    this.submitted.emit({
      currency: this.currencyStore.selectedCurrency(),
      amount: formatAmountInput(amountNumber),
      requestingFrom: from,
    });

    this.amount.set('');
    this.closed.emit();
  }
}
