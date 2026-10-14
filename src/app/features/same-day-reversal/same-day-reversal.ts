import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CalloverStore } from '../../shared/callover.store';
import { FieldLabel } from '../../shared/field-label/field-label';
import { MessagePopup } from '../../shared/message-popup/message-popup';
import {
  denominationDescription,
  lookupSameDayReversal,
  SameDayReversalView,
} from '../../shared/same-day-reversal.mock';
import { TillStore } from '../../shared/till.store';

@Component({
  selector: 'app-same-day-reversal',
  imports: [DecimalPipe, RouterLink, MessagePopup, FieldLabel],
  templateUrl: './same-day-reversal.html',
  styleUrl: './same-day-reversal.css',
})
export class SameDayReversal implements OnDestroy {
  private readonly calloverStore = inject(CalloverStore);
  private readonly tillStore = inject(TillStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private lookupDebounce: ReturnType<typeof setTimeout> | null = null;
  private lookupDelayTimer: ReturnType<typeof setTimeout> | null = null;

  /** Brief pause so Enter / lookup feels like a fetch (demo). */
  private static readonly ENTER_LOOKUP_MS = 420;

  readonly transNo = signal('');
  readonly reversal = signal<SameDayReversalView | null>(null);
  readonly lookupHint = signal('');
  readonly lookupLoading = signal(false);
  readonly feedbackMessage = signal('');

  readonly hasReversal = computed(() => this.reversal() !== null);
  readonly denominationTotal = computed(() =>
    (this.reversal()?.denominations ?? []).reduce((sum, line) => sum + line.amount, 0),
  );

  denominationDescription = denominationDescription;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const fromQuery = params.get('transNo')?.trim();
      if (!fromQuery) {
        return;
      }
      this.transNo.set(fromQuery);
      this.runLookupWithDelay(true);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { transNo: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  ngOnDestroy(): void {
    this.clearLookupSchedule();
    this.clearLookupDelay();
  }

  onTransNoInput(value: string): void {
    this.transNo.set(value);
    if (!value.trim()) {
      this.clearLookupSchedule();
      this.reversal.set(null);
      this.lookupHint.set('');
      this.lookupLoading.set(false);
      return;
    }
    this.lookupLoading.set(true);
    this.lookupHint.set('');
    this.scheduleLookup();
  }

  onTransNoBlur(): void {
    this.clearLookupSchedule();
    this.runLookupWithDelay(false);
  }

  onTransNoEnter(event: Event): void {
    event.preventDefault();
    this.clearLookupSchedule();
    this.runLookupWithDelay(true);
  }

  private scheduleLookup(): void {
    this.clearLookupSchedule();
    this.lookupDebounce = setTimeout(() => {
      this.lookupDebounce = null;
      this.runLookupWithDelay(true);
    }, 450);
  }

  private clearLookupSchedule(): void {
    if (this.lookupDebounce) {
      clearTimeout(this.lookupDebounce);
      this.lookupDebounce = null;
    }
  }

  private clearLookupDelay(): void {
    if (this.lookupDelayTimer) {
      clearTimeout(this.lookupDelayTimer);
      this.lookupDelayTimer = null;
    }
  }

  private beginLookup(): void {
    this.lookupLoading.set(true);
    this.reversal.set(null);
    this.lookupHint.set('');
  }

  private runLookupWithDelay(showMinimumDelay: boolean): void {
    const input = this.transNo().trim();
    if (!input) {
      this.reversal.set(null);
      this.lookupHint.set('');
      this.lookupLoading.set(false);
      return;
    }

    if (input.length < 5) {
      this.reversal.set(null);
      this.lookupHint.set('');
      this.lookupLoading.set(false);
      return;
    }

    this.beginLookup();
    this.clearLookupDelay();

    const delay = showMinimumDelay ? SameDayReversal.ENTER_LOOKUP_MS : 0;
    if (delay === 0) {
      this.finishLookup();
      return;
    }

    this.lookupDelayTimer = setTimeout(() => {
      this.lookupDelayTimer = null;
      this.finishLookup();
    }, delay);
  }

  private finishLookup(): void {
    const input = this.transNo().trim();

    const match = lookupSameDayReversal(
      input,
      this.calloverStore.rows(),
      (total) => this.tillStore.breakIntoDenominations(total),
    );

    if (!match) {
      this.reversal.set(null);
      this.lookupHint.set('No transaction found for that number. Try a callover/journal trans no (e.g. TXN-88011).');
      this.lookupLoading.set(false);
      return;
    }

    this.transNo.set(match.transNo);
    this.reversal.set(match);
    this.lookupHint.set('');
    this.lookupLoading.set(false);
  }

  onSubmit(): void {
    const record = this.reversal();
    if (!record) {
      this.feedbackMessage.set('Enter a valid transaction number to reverse.');
      return;
    }
    this.feedbackMessage.set(
      `Same day reversal submitted for ${record.transNo} (${record.amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}).`,
    );
    this.resetForm();
  }

  private resetForm(): void {
    this.clearLookupSchedule();
    this.clearLookupDelay();
    this.transNo.set('');
    this.reversal.set(null);
    this.lookupHint.set('');
    this.lookupLoading.set(false);
  }
}
