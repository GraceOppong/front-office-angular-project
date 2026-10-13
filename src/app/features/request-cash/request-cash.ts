import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { CashRequestStore } from '../../shared/cash-request.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';

interface CurrencyOption {
  name: string;
}

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

  readonly closed = output<void>();
  readonly submitted = output<{ currency: string; amount: string; requestingFrom: string }>();

  readonly currencies: CurrencyOption[] = [
    { name: 'GHANA CEDIS' },
    { name: 'US DOLLAR' },
    { name: 'EURO' },
    { name: 'POUND STERLING' },
  ];

  readonly requestFromOptions: RequestFromOption[] = [
    { id: '102893', name: 'VAULT CUSTODIAN' },
    { id: '102890', name: 'HENRY AMOH' },
    { id: '102891', name: 'AMA MENSAH' },
    { id: '102892', name: 'KOFI OWUSU' },
  ];

  readonly currency = signal('');
  readonly amount = signal('');
  readonly requestingFromId = signal(this.requestFromOptions[0].id);
  readonly feedbackMessage = signal('');

  readonly awaitingVaultRequests = this.cashRequestStore.awaitingVaultRequests;
  readonly rejectedRequests = this.cashRequestStore.rejectedRequests;

  readonly showRejectedTable = computed(() => this.rejectedRequests().length > 0);

  onCurrencyChange(value: string): void {
    this.currency.set(value);
  }

  onRequestingFromChange(value: string): void {
    this.requestingFromId.set(value);
  }

  onAmountInput(value: string): void {
    this.amount.set(value);
  }

  deletePending(id: string): void {
    this.cashRequestStore.delete(id);
    this.feedbackMessage.set('Pending request deleted.');
  }

  acknowledgeRejected(id: string): void {
    this.cashRequestStore.acknowledgeRejected(id);
    this.feedbackMessage.set('Rejected request acknowledged.');
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

    const value = this.amount().trim();
    if (!value) {
      this.feedbackMessage.set('Enter an amount before submitting.');
      return;
    }

    const amountNumber = Number(value);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      this.feedbackMessage.set('Enter a valid amount greater than zero.');
      return;
    }

    const from =
      this.requestFromOptions.find((item) => item.id === this.requestingFromId())?.name ?? '';

    const row = this.cashRequestStore.addAwaitingVault({
      amount: amountNumber,
      currency: this.currency(),
      requestingFrom: from,
      teller: 'TESTTEL',
    });

    this.submitted.emit({
      currency: this.currency(),
      amount: value,
      requestingFrom: from,
    });

    this.feedbackMessage.set(`Cash request ${row.batchNo} sent to vault for issue.`);
    this.amount.set('');
  }
}
