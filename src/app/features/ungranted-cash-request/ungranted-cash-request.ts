import { DecimalPipe } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { CashRequestStore } from '../../shared/cash-request.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';

@Component({
  selector: 'app-ungranted-cash-request',
  imports: [DecimalPipe, MessagePopup],
  templateUrl: './ungranted-cash-request.html',
  styleUrl: './ungranted-cash-request.css',
})
export class UngrantedCashRequest {
  private readonly cashRequestStore = inject(CashRequestStore);

  readonly closed = output<void>();

  readonly requests = this.cashRequestStore.awaitingVaultRequests;
  readonly total = this.cashRequestStore.ungrantedTotal;
  readonly feedbackMessage = signal('');

  deleteRequest(id: string): void {
    this.cashRequestStore.delete(id);
    this.feedbackMessage.set('Ungranted request cancelled.');
  }

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }
}
