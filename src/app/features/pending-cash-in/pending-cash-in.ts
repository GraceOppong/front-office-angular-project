import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { CashRequestStore } from '../../shared/cash-request.store';
import { TillStore } from '../../shared/till.store';

@Component({
  selector: 'app-pending-cash-in',
  imports: [DecimalPipe],
  templateUrl: './pending-cash-in.html',
  styleUrl: './pending-cash-in.css',
})
export class PendingCashIn {
  private readonly cashRequestStore = inject(CashRequestStore);
  private readonly tillStore = inject(TillStore);

  readonly closed = output<void>();
  readonly accepted = output<number>();
  readonly rejected = output<void>();

  readonly pendingAmount = this.cashRequestStore.pendingCashIn;
  readonly pendingRequests = this.cashRequestStore.pendingRequests;
  readonly denominationLines = this.cashRequestStore.pendingLines;

  readonly breakdownTotal = computed(() =>
    this.denominationLines().reduce((sum, line) => sum + line.amount, 0),
  );

  readonly tallies = computed(() => this.breakdownTotal() === this.pendingAmount());

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }

  onAccept(): void {
    const amount = this.pendingAmount();
    if (amount <= 0 || !this.tallies()) {
      return;
    }

    const { total, lines } = this.cashRequestStore.acceptAllPending();
    this.tillStore.applyDenominationLines(lines);
    this.tillStore.addCashReceived(total, lines);
    this.tillStore.recordVaultCashReceived(total);
    this.accepted.emit(total);
    this.closed.emit();
  }

  onReject(): void {
    if (this.pendingAmount() <= 0) {
      return;
    }

    this.cashRequestStore.rejectAllPending();
    this.rejected.emit();
    this.closed.emit();
  }
}
