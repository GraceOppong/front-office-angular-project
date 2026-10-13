import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { CashTransferStore } from '../../shared/cash-transfer.store';
import { TillStore } from '../../shared/till.store';
@Component({
  selector: 'app-pending-cash-out',
  imports: [DecimalPipe],
  templateUrl: './pending-cash-out.html',
  styleUrl: './pending-cash-out.css',
})
export class PendingCashOut {
  private readonly cashTransferStore = inject(CashTransferStore);
  private readonly tillStore = inject(TillStore);
  readonly closed = output<void>();
  readonly cancelled = output<number>();

  readonly pendingAmount = this.cashTransferStore.pendingCashOut;
  readonly pendingTransfers = this.cashTransferStore.pendingCashOutTransfers;
  readonly denominationLines = this.cashTransferStore.pendingLines;

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

  onCancelTransfer(): void {
    const amount = this.pendingAmount();
    if (amount <= 0) {
      return;
    }

    const awaiting = this.cashTransferStore.cancelAllAwaitingVault();
    for (const transfer of awaiting) {
      this.tillStore.applyDenominationLines(transfer.lines);
    }

    this.cancelled.emit(amount);
    this.closed.emit();
  }
}
