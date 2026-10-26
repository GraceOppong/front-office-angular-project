import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, output, signal } from '@angular/core';
import {
  formatAmountOnBlur,
  formatAmountInput,
  parseAmountInput,
  restrictAmountTyping,
} from '../../shared/amount-input';
import { CashRequestStore } from '../../shared/cash-request.store';
import { WorkspaceCurrencyStore } from '../../shared/workspace-currency.store';
import { FieldLabel } from '../../shared/field-label/field-label';
import { MessagePopup } from '../../shared/message-popup/message-popup';
import {
  usgPageCount,
  usgPaginateSlice,
  USG_DEFAULT_PAGE_SIZE_OPTIONS,
} from '../../shared/usg-table-pagination/usg-pagination.util';
import { UsgTablePagination } from '../../shared/usg-table-pagination/usg-table-pagination';

interface RequestFromOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-request-cash',
  imports: [DecimalPipe, MessagePopup, FieldLabel, UsgTablePagination],
  templateUrl: './request-cash.html',
  styleUrl: './request-cash.css',
})
export class RequestCash {
  private readonly cashRequestStore = inject(CashRequestStore);
  readonly currencyStore = inject(WorkspaceCurrencyStore);

  readonly pageSizeOptions = [...USG_DEFAULT_PAGE_SIZE_OPTIONS];
  readonly awaitingPage = signal(1);
  readonly awaitingPageSize = signal(5);
  readonly rejectedPage = signal(1);
  readonly rejectedPageSize = signal(5);

  constructor() {
    effect(() => {
      this.awaitingVaultRequests().length;
      this.awaitingPage.set(1);
    });
    effect(() => {
      this.rejectedRequests().length;
      this.rejectedPage.set(1);
    });
    effect(() => {
      const max = usgPageCount(this.awaitingVaultRequests().length, this.awaitingPageSize());
      if (this.awaitingPage() > max) {
        this.awaitingPage.set(max);
      }
    });
    effect(() => {
      const max = usgPageCount(this.rejectedRequests().length, this.rejectedPageSize());
      if (this.rejectedPage() > max) {
        this.rejectedPage.set(max);
      }
    });
  }

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

  readonly pagedAwaitingVaultRequests = computed(() =>
    usgPaginateSlice(this.awaitingVaultRequests(), this.awaitingPage(), this.awaitingPageSize()),
  );

  readonly pagedRejectedRequests = computed(() =>
    usgPaginateSlice(this.rejectedRequests(), this.rejectedPage(), this.rejectedPageSize()),
  );

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
