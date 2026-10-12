import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { CashTransferStore } from '../../shared/cash-transfer.store';
import { TillStore } from '../../shared/till.store';
import { VaultStore } from '../../shared/vault.store';

@Component({
  selector: 'app-pending-cash-out',
  imports: [DecimalPipe],
  templateUrl: './pending-cash-out.html',
  styleUrl: './pending-cash-out.css',
})
export class PendingCashOut {
  private readonly cashTransferStore = inject(CashTransferStore);
  private readonly tillStore = inject(TillStore);
  private readonly vaultStore = inject(VaultStore);

  readonly closed = output<void>();
  readonly accepted = output<number>();
  readonly rejected = output<void>();

  readonly pendingAmount = this.cashTransferStore.pendingCashOut;
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

  onAccept(): void {
    const amount = this.pendingAmount();
    if (amount <= 0) {
      return;
    }

    const pending = this.cashTransferStore.pendingTransfers();
    const { total, lines } = this.cashTransferStore.acceptAllPending();
    this.tillStore.removeDenominationLines(lines);
    this.tillStore.addCashSent(total, lines);

    for (const transfer of pending) {
      this.vaultStore.recordReceive(transfer.batchNo, transfer.teller, transfer.total, transfer.lines);
    }

    this.accepted.emit(total);
    this.closed.emit();
  }

  onReject(): void {
    if (this.pendingAmount() <= 0) {
      return;
    }

    this.cashTransferStore.rejectAllPending();
    this.rejected.emit();
    this.closed.emit();
  }
}
