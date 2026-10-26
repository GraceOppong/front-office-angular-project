import { DecimalPipe } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CashRequestStore } from '../../shared/cash-request.store';
import { CashTransferStore } from '../../shared/cash-transfer.store';
import { TillStore } from '../../shared/till.store';
import { WorkspaceCurrencyStore } from '../../shared/workspace-currency.store';
import { CashReceived } from '../cash-received/cash-received';
import { CashSent } from '../cash-sent/cash-sent';
import { PendingCashIn } from '../pending-cash-in/pending-cash-in';
import { PendingCashOut } from '../pending-cash-out/pending-cash-out';
import { RequestCash } from '../request-cash/request-cash';
import { TransferCash } from '../transfer-cash/transfer-cash';
import { UngrantedCashRequest } from '../ungranted-cash-request/ungranted-cash-request';
import { LucideUndo2 } from '@lucide/angular';
import { MessagePopup } from '../../shared/message-popup/message-popup';
import { TELLER_CALLOVER_JOURNAL_PATH, TELLER_CALLOVER_JOURNAL_TITLE } from '../../shared/callover.store';
import { DenominationDescriptionPipe } from '../../shared/denomination-description.pipe';
import { FieldLabel } from '../../shared/field-label/field-label';
import {
  HOME_PAGE_LAYOUT_LABELS,
  HOME_PAGE_LAYOUTS,
  HomePageLayout,
  readHomePageLayout,
  saveHomePageLayout,
} from '../../shared/home-page-layout';
import { buildTellerInternalActionLabels } from './teller-quick-actions';

@Component({
  selector: 'app-teller-activities',
  imports: [
    DecimalPipe,
    DenominationDescriptionPipe,
    RequestCash,
    PendingCashIn,
    TransferCash,
    PendingCashOut,
    CashReceived,
    CashSent,
    UngrantedCashRequest,
    LucideUndo2,
    MessagePopup,
    FieldLabel,
  ],
  templateUrl: './teller-activities.html',
  styleUrl: './teller-activities.css',
})
export class TellerActivities implements OnInit {
  readonly tellerCalloverJournalTitle = TELLER_CALLOVER_JOURNAL_TITLE;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly cashRequestStore = inject(CashRequestStore);
  readonly cashTransferStore = inject(CashTransferStore);
  readonly tillStore = inject(TillStore);
  readonly currencyStore = inject(WorkspaceCurrencyStore);

  readonly screenTitle = 'Teller Activities';
  readonly homePageLayoutOptions = HOME_PAGE_LAYOUTS.map((id) => ({
    id,
    label: HOME_PAGE_LAYOUT_LABELS[id],
  }));
  readonly homePageLayout = signal<HomePageLayout>(readHomePageLayout());
  readonly tellerInternalActionLabels = buildTellerInternalActionLabels(this.tellerCalloverJournalTitle);
  readonly feedbackMessage = signal('');
  readonly showRequestCashModal = signal(false);
  readonly showPendingCashInModal = signal(false);
  readonly showTransferCashModal = signal(false);
  readonly showPendingCashOutModal = signal(false);
  readonly showCashReceivedModal = signal(false);
  readonly showCashSentModal = signal(false);
  readonly showUngrantedCashModal = signal(false);

  readonly depositedAmountVariance = computed(
    () => this.tillStore.cashDeposited() - this.tillStore.cashDepositedTarget(),
  );
  readonly depositedCountVariance = computed(
    () => this.tillStore.cashDepositedCount() - this.tillStore.cashDepositedCountTarget(),
  );
  readonly withdrawnAmountVariance = computed(
    () => this.tillStore.cashWithdrawn() - this.tillStore.cashWithdrawnTarget(),
  );
  readonly withdrawnCountVariance = computed(
    () => this.tillStore.cashWithdrawnCount() - this.tillStore.cashWithdrawnCountTarget(),
  );

  readonly vaultNetFlow = computed(
    () => this.tillStore.vaultCashReceived() - this.tillStore.vaultCashSent(),
  );

  readonly depositedAmountProgress = computed(() => {
    const target = this.tillStore.cashDepositedTarget();
    if (target <= 0) {
      return 0;
    }
    return Math.min(100, (this.tillStore.cashDeposited() / target) * 100);
  });

  readonly depositedCountProgress = computed(() => {
    const target = this.tillStore.cashDepositedCountTarget();
    if (target <= 0) {
      return 0;
    }
    return Math.min(100, (this.tillStore.cashDepositedCount() / target) * 100);
  });

  readonly withdrawnAmountProgress = computed(() => {
    const target = this.tillStore.cashWithdrawnTarget();
    if (target <= 0) {
      return 0;
    }
    return Math.min(100, (this.tillStore.cashWithdrawn() / target) * 100);
  });

  readonly depositedAmountProgressPct = computed(() => Math.round(this.depositedAmountProgress()));

  readonly withdrawnAmountProgressPct = computed(() => Math.round(this.withdrawnAmountProgress()));

  readonly withdrawnCountProgress = computed(() => {
    const target = this.tillStore.cashWithdrawnCountTarget();
    if (target <= 0) {
      return 0;
    }
    return Math.min(100, (this.tillStore.cashWithdrawnCount() / target) * 100);
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const modal = params.get('modal');
      if (!modal) {
        return;
      }
      this.openModalFromQuery(modal);
    });

    afterNextRender(() => {
      this.bindViewportHeightSync();
    });
  }

  ngOnInit(): void {
    this.homePageLayout.set(readHomePageLayout());
  }

  private bindViewportHeightSync(): void {
    const root = document.documentElement;
    const sync = (): void => {
      root.style.setProperty('--fo-vh', `${window.innerHeight * 0.01}px`);
    };
    sync();
    window.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
    });
  }

  private openModalFromQuery(modal: string): void {
    this.showRequestCashModal.set(false);
    this.showPendingCashInModal.set(false);
    this.showTransferCashModal.set(false);
    this.showPendingCashOutModal.set(false);
    this.showCashReceivedModal.set(false);
    this.showCashSentModal.set(false);
    this.showUngrantedCashModal.set(false);

    switch (modal) {
      case 'request-cash':
        this.showRequestCashModal.set(true);
        break;
      case 'transfer-cash':
        this.showTransferCashModal.set(true);
        break;
      case 'pending-cash-in':
        this.ensurePendingCashInSample();
        this.showPendingCashInModal.set(true);
        break;
      case 'pending-cash-out':
        this.ensurePendingCashOutSample();
        this.showPendingCashOutModal.set(true);
        break;
      case 'cash-received':
        this.showCashReceivedModal.set(true);
        break;
      case 'cash-sent':
        this.showCashSentModal.set(true);
        break;
      case 'ungranted-cash-request':
        this.showUngrantedCashModal.set(true);
        break;
      default:
        break;
    }
  }

  private ensurePendingCashInSample(): void {
    if (this.cashRequestStore.pendingCashIn() > 0) {
      return;
    }
    const row = this.cashRequestStore.addAwaitingVault({
      amount: 5000,
      currency: 'GHANA CEDIS',
      requestingFrom: 'MAIN VAULT',
    });
    this.cashRequestStore.issueFromVault(row.id, [
      { denomination: '200', quantity: 10, amount: 2000 },
      { denomination: '100', quantity: 20, amount: 2000 },
      { denomination: '50', quantity: 20, amount: 1000 },
    ]);
  }

  private ensurePendingCashOutSample(): void {
    if (this.cashTransferStore.pendingCashOut() > 0) {
      return;
    }
    const lines = [
      { denomination: '200', quantity: 5, amount: 1000 },
      { denomination: '100', quantity: 10, amount: 1000 },
    ];
    if (this.tillStore.canRemoveLines(lines)) {
      this.cashTransferStore.addAwaitingVault({
        currency: 'GHANA CEDIS',
        vault: 'MAIN VAULT',
        lines,
      });
      this.tillStore.removeDenominationLines(lines);
    }
  }

  onCurrencyChange(value: string): void {
    this.currencyStore.setCurrency(value);
  }

  onHomePageLayoutChange(value: string): void {
    if (!HOME_PAGE_LAYOUTS.includes(value as HomePageLayout)) {
      return;
    }
    const layout = value as HomePageLayout;
    this.homePageLayout.set(layout);
    saveHomePageLayout(layout);
  }

  onQuickAction(label: string): void {
    if (label === 'Request Cash') {
      this.showRequestCashModal.set(true);
      return;
    }

    if (label === 'Transfer Cash') {
      this.showTransferCashModal.set(true);
      return;
    }

    if (label === 'Pending Cash In') {
      if (this.cashRequestStore.pendingCashIn() <= 0) {
        this.feedbackMessage.set('No pending cash in to verify.');
        return;
      }
      this.showPendingCashInModal.set(true);
      return;
    }

    if (label === 'Pending Cash Out') {
      if (this.cashTransferStore.pendingCashOut() <= 0) {
        this.feedbackMessage.set('No pending cash out to approve.');
        return;
      }
      this.showPendingCashOutModal.set(true);
      return;
    }

    if (label === 'Cash Received') {
      this.showCashReceivedModal.set(true);
      return;
    }

    if (label === 'Cash Sent') {
      this.showCashSentModal.set(true);
      return;
    }

    if (label === 'Ungranted Cash Request') {
      this.showUngrantedCashModal.set(true);
      return;
    }

    if (label === TELLER_CALLOVER_JOURNAL_TITLE || label === 'Teller Callover') {
      void this.router.navigateByUrl(TELLER_CALLOVER_JOURNAL_PATH);
      return;
    }

    if (label === 'Cash Deposit') {
      void this.router.navigate(['/cash-deposit']);
      return;
    }

    if (label === 'Cash Withdrawal') {
      void this.router.navigate(['/cash-withdrawal']);
      return;
    }

    if (label === 'Same Day Reversal') {
      void this.router.navigateByUrl('/same-day-reversal');
      return;
    }

  }

  closeRequestCashModal(): void {
    this.showRequestCashModal.set(false);
  }

  closePendingCashInModal(): void {
    this.showPendingCashInModal.set(false);
  }

  closeTransferCashModal(): void {
    this.showTransferCashModal.set(false);
  }

  closePendingCashOutModal(): void {
    this.showPendingCashOutModal.set(false);
  }

  closeCashReceivedModal(): void {
    this.showCashReceivedModal.set(false);
  }

  closeCashSentModal(): void {
    this.showCashSentModal.set(false);
  }

  closeUngrantedCashModal(): void {
    this.showUngrantedCashModal.set(false);
  }

  onRequestCashSubmitted(_payload: { currency: string; amount: string; requestingFrom: string }): void {
    this.showRequestCashModal.set(false);
  }

  onTransferCashSubmitted(_payload: { currency: string; vault: string; amount: number }): void {
    this.showTransferCashModal.set(false);
  }

  onPendingCashAccepted(_amount: number): void {
    this.showPendingCashInModal.set(false);
  }

  onPendingCashRejected(): void {
    this.showPendingCashInModal.set(false);
  }

  onPendingCashOutCancelled(_amount: number): void {
    this.showPendingCashOutModal.set(false);
  }
}
