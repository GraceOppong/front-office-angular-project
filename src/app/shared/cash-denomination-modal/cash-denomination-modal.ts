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
import { DenominationDescriptionPipe } from '../denomination-description.pipe';
import {
  amountDraftFromQuantity,
  parseWholeAmountInput,
  quantityFromEnteredAmount,
} from '../cash-denomination.helpers';
import { DEFAULT_DENOMS, DenominationLine, TillStore } from '../till.store';

export type CashDenominationMode = 'receive' | 'pay';

interface DenominationRow {
  id: string;
  denominationDraft: string;
  denomination: string;
  quantity: number;
  amountDraft: string;
}

const KNOWN_DENOMS = new Set(DEFAULT_DENOMS.map(String));

@Component({
  selector: 'app-cash-denomination-modal',
  imports: [DecimalPipe, DenominationDescriptionPipe],
  templateUrl: './cash-denomination-modal.html',
  styleUrl: './cash-denomination-modal.css',
})
export class CashDenominationModal implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly tillStore = inject(TillStore);
  private rowSeq = 0;

  readonly targetAmount = input.required<number>();
  readonly mode = input<CashDenominationMode>('receive');
  readonly initialLines = input<DenominationLine[] | null>(null);

  readonly confirmed = output<DenominationLine[]>();
  readonly cancelled = output<void>();

  readonly formError = signal('');
  readonly rows = signal<DenominationRow[]>([]);

  readonly entryTotal = computed(() =>
    this.rows().reduce((sum, row) => {
      const denom = Number(row.denomination);
      return Number.isFinite(denom) && denom > 0 ? sum + row.quantity * denom : sum;
    }, 0),
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
      this.targetAmount();
      const seed = this.initialLines();

      if (seed?.length) {
        this.rows.set(
          seed.map((line) =>
            this.createRow({
              denominationDraft: line.denomination,
              denomination: line.denomination,
              quantity: line.quantity,
              amountDraft: amountDraftFromQuantity(line.quantity, Number(line.denomination)),
            }),
          ),
        );
      } else {
        this.rows.set([this.createRow()]);
      }
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

  onDenominationInput(id: string, value: string): void {
    const digits = value.replace(/\D/g, '');
    const resolved = this.resolveDenomination(digits, id, false);

    this.rows.update((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }
        return this.recalculateRow({
          ...row,
          denominationDraft: digits,
          denomination: resolved,
        });
      }),
    );

    if (digits && !this.isKnownOrPrefix(digits)) {
      this.formError.set(`Unknown denomination ${digits}. Use 200, 100, 50, 20, 10, 5, 2 or 1.`);
    } else if (resolved && this.isDuplicate(resolved, id)) {
      this.formError.set(`Denomination ${resolved} is already added.`);
    } else if (this.formError()) {
      this.formError.set('');
    }
  }

  onDenominationBlur(id: string): void {
    const row = this.rows().find((item) => item.id === id);
    if (!row) {
      return;
    }

    if (!row.denominationDraft) {
      this.rows.update((current) =>
        current.map((item) =>
          item.id === id ? { ...item, denomination: '', quantity: 0, amountDraft: '' } : item,
        ),
      );
      return;
    }

    if (!KNOWN_DENOMS.has(row.denominationDraft)) {
      this.formError.set(
        `Unknown denomination ${row.denominationDraft}. Use 200, 100, 50, 20, 10, 5, 2 or 1.`,
      );
      return;
    }

    if (this.isDuplicate(row.denominationDraft, id)) {
      this.formError.set(`Denomination ${row.denominationDraft} is already added.`);
      this.rows.update((current) =>
        current.map((item) =>
          item.id === id ? { ...item, denomination: '', quantity: 0 } : item,
        ),
      );
      return;
    }

    this.rows.update((current) =>
      current.map((item) =>
        item.id === id
          ? this.recalculateRow({ ...item, denomination: item.denominationDraft })
          : item,
      ),
    );
  }

  onAmountInput(id: string, value: string): void {
    const digits = value.replace(/\D/g, '');
    this.rows.update((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }
        return this.recalculateRow({ ...row, amountDraft: digits });
      }),
    );
  }

  onAmountBlur(id: string): void {
    this.rows.update((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              amountDraft: amountDraftFromQuantity(row.quantity, Number(row.denomination) || 0),
            }
          : row,
      ),
    );
  }

  addRow(): void {
    const empty = this.rows().find((row) => !row.denominationDraft);
    if (empty) {
      this.focusDenomination(empty.id);
      return;
    }

    const next = this.createRow();
    this.rows.update((current) => [...current, next]);
    this.focusDenomination(next.id);
  }

  removeRow(id: string): void {
    const remaining = this.rows().filter((row) => row.id !== id);
    this.rows.set(remaining.length ? remaining : [this.createRow()]);
    this.formError.set('');
  }

  onConfirm(): void {
    const lines = this.buildLines();
    if (lines.length === 0) {
      this.formError.set('Enter at least one denomination amount.');
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

  availableFor(denomination: string): number | string {
    if (this.mode() !== 'pay' || !denomination) {
      return '';
    }
    return this.tillStore.availableQuantity(denomination);
  }

  private createRow(partial: Partial<DenominationRow> = {}): DenominationRow {
    this.rowSeq += 1;
    return {
      id: `denom-row-${this.rowSeq}`,
      denominationDraft: '',
      denomination: '',
      quantity: 0,
      amountDraft: '',
      ...partial,
    };
  }

  private resolveDenomination(draft: string, id: string, allowPrefixMatch: boolean): string {
    if (!KNOWN_DENOMS.has(draft) || this.isDuplicate(draft, id)) {
      return '';
    }
    if (!allowPrefixMatch && this.isPrefixOfLongerDenom(draft)) {
      return '';
    }
    return draft;
  }

  private isPrefixOfLongerDenom(draft: string): boolean {
    return DEFAULT_DENOMS.some((denom) => {
      const value = String(denom);
      return value !== draft && value.startsWith(draft);
    });
  }

  private isKnownOrPrefix(draft: string): boolean {
    return DEFAULT_DENOMS.some((denom) => String(denom).startsWith(draft));
  }

  private isDuplicate(denomination: string, id: string): boolean {
    return this.rows().some((row) => row.id !== id && row.denomination === denomination);
  }

  private recalculateRow(row: DenominationRow): DenominationRow {
    const denomValue = Number(row.denomination);
    if (!row.denomination || !Number.isFinite(denomValue) || denomValue <= 0) {
      return { ...row, quantity: 0 };
    }

    const enteredAmount = parseWholeAmountInput(row.amountDraft);
    const available =
      this.mode() === 'pay' ? this.tillStore.availableQuantity(row.denomination) : undefined;
    const uncapped = quantityFromEnteredAmount(enteredAmount, denomValue);
    const quantity = quantityFromEnteredAmount(enteredAmount, denomValue, available);

    if (available !== undefined && uncapped > available) {
      this.formError.set(`Only ${available} available for denomination ${row.denomination}.`);
    } else if (this.formError().includes(row.denomination)) {
      this.formError.set('');
    }

    return { ...row, quantity };
  }

  private focusDenomination(id: string): void {
    queueMicrotask(() => {
      this.document.getElementById(`denom-${id}`)?.focus();
    });
  }

  private buildLines(): DenominationLine[] {
    return this.rows()
      .filter((row) => row.denomination && row.quantity > 0)
      .map((row) => ({
        denomination: row.denomination,
        quantity: row.quantity,
        amount: row.quantity * Number(row.denomination),
      }));
  }
}
