import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output } from '@angular/core';
import { TillStore } from '../../shared/till.store';

@Component({
  selector: 'app-cash-sent',
  imports: [DecimalPipe],
  templateUrl: './cash-sent.html',
  styleUrl: './cash-sent.css',
})
export class CashSent {
  private readonly tillStore = inject(TillStore);

  readonly closed = output<void>();

  readonly total = this.tillStore.cashSent;
  readonly denominationLines = this.tillStore.cashSentLines;

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
