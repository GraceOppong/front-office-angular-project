import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { TillStore } from '../../shared/till.store';
import { DenominationDescriptionPipe } from '../../shared/denomination-description.pipe';

@Component({
  selector: 'app-cash-received',
  imports: [DecimalPipe, DenominationDescriptionPipe],
  templateUrl: './cash-received.html',
  styleUrl: './cash-received.css',
})
export class CashReceived {
  private readonly tillStore = inject(TillStore);

  readonly closed = output<void>();

  readonly total = this.tillStore.cashReceived;
  readonly denominationLines = this.tillStore.cashReceivedLines;

  readonly breakdownTotal = computed(() =>
    this.denominationLines().reduce((sum, line) => sum + line.amount, 0),
  );

  readonly tallies = computed(() => this.breakdownTotal() === this.total());

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }
}
