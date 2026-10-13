import { DecimalPipe, DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { DEFAULT_DENOMS, DenominationLine, TillStore } from '../till.store';

export type CashDenominationMode = 'receive' | 'pay';

interface DenominationRow {
  denomination: string;
  quantity: number;
}

@Component({
  selector: 'app-cash-denomination-modal',
  imports: [DecimalPipe],
  templateUrl: './cash-denomination-modal.html',
  styleUrl: './cash-denomination-modal.css',
})
export class CashDenominationModal implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly tillStore = inject(TillStore);

  readonly targetAmount = input.required<number>();
  readonly mode = input<CashDenominationMode>('receive');
  readonly initialLines = input<DenominationLine[] | null>(null);

  readonly confirmed = output<DenominationLine[]>();
  readonly cancelled = output<void>();

  readonly formError = signal('');
  readonly rows = signal<DenominationRow[]>([]);

  readonly entryTotal = computed(() =>
    this.rows().reduce((sum, row) => sum + row.quantity * Number(row.denomination), 0),
  );

  readonly tallies = computed(() => {
    const target = this.targetAmount();
    return Math.round(this.entryTotal() * 100) === Math.round(target * 100);
  });

  readonly modeLabel = computed(() =>
    this.mode() === 'pay' ? 'Cash payout' : 'Cash received',
  );

  constructor() {
    this.document.body.style.overflow = 'hidden';

    effect(() => {
      const target = this.targetAmount();
      const seed = this.initialLines();
      const qtyMap = new Map<string, number>();

      if (seed?.length) {
        for (const line of seed) {
          qtyMap.set(line.denomination, line.quantity);
        }
      }

      this.rows.set(
        DEFAULT_DENOMS.map((denom) => ({
          denomination: String(denom),
          quantity: qtyMap.get(String(denom)) ?? 0,
        })),
      );
      this.formError.set('');
    });
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onQuantityInput(denomination: string, value: string): void {
    const digits = value.replace(/\D/g, '');
    let quantity = digits ? Math.floor(Number(digits)) : 0;

    if (this.mode() === 'pay') {
      const available = this.tillStore.availableQuantity(denomination);
      if (quantity > available) {
        quantity = available;
        this.formError.set(`Only ${available} available for denomination ${denomination}.`);
      } else if (this.formError().includes(denomination)) {
        this.formError.set('');
      }
    }

    this.rows.update((current) =>
      current.map((row) => (row.denomination === denomination ? { ...row, quantity } : row)),
    );
  }

  onConfirm(): void {
    const lines = this.buildLines();
    if (lines.length === 0) {
      this.formError.set('Enter at least one denomination quantity.');
      return;
    }

    if (!this.tallies()) {
      this.formError.set('Denomination total must match the transaction amount.');
      return;
    }

    if (this.mode() === 'pay' && !this.tillStore.canRemoveLines(lines)) {
      this.formError.set('Till does not have enough cash for this payout.');
      return;
    }

    this.confirmed.emit(lines);
  }

  availableFor(denomination: string): number | null {
    if (this.mode() !== 'pay') {
      return null;
    }
    return this.tillStore.availableQuantity(denomination);
  }

  lineAmount(row: DenominationRow): number {
    return row.quantity * Number(row.denomination);
  }

  private buildLines(): DenominationLine[] {
    return this.rows()
      .filter((row) => row.quantity > 0)
      .map((row) => ({
        denomination: row.denomination,
        quantity: row.quantity,
        amount: row.quantity * Number(row.denomination),
      }));
  }
}
