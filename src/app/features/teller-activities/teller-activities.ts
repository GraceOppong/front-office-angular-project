import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CashRequestStore } from '../../shared/cash-request.store';
import { CashTransferStore } from '../../shared/cash-transfer.store';
import { TillStore } from '../../shared/till.store';
import { CashReceived } from '../cash-received/cash-received';
import { CashSent } from '../cash-sent/cash-sent';
import { PendingCashIn } from '../pending-cash-in/pending-cash-in';
import { PendingCashOut } from '../pending-cash-out/pending-cash-out';
import { RequestCash } from '../request-cash/request-cash';
import { TransferCash } from '../transfer-cash/transfer-cash';
import { UngrantedCashRequest } from '../ungranted-cash-request/ungranted-cash-request';
import { MessagePopup } from '../../shared/message-popup/message-popup';
import { TELLER_CALLOVER_JOURNAL_PATH, TELLER_CALLOVER_JOURNAL_TITLE } from '../../shared/callover.store';

@Component({
  selector: 'app-teller-activities',
  imports: [
    DecimalPipe,
    RequestCash,
    PendingCashIn,
    TransferCash,
    PendingCashOut,
    CashReceived,
    CashSent,
    UngrantedCashRequest,
    MessagePopup,
  ],
  templateUrl: './teller-activities.html',
  styleUrl: './teller-activities.css',
})
export class TellerActivities {
  readonly tellerCalloverJournalTitle = TELLER_CALLOVER_JOURNAL_TITLE;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly cashRequestStore = inject(CashRequestStore);
  readonly cashTransferStore = inject(CashTransferStore);
  readonly tillStore = inject(TillStore);

  readonly screenTitle = 'Teller Activities';
  readonly currencies = [
    'GHANA CEDIS',
    'US DOLLAR',
    'EURO',
    'POUND STERLING',
  ];

  readonly selectedCurrency = signal('');
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

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const modal = params.get('modal');
      if (!modal) {
        return;
      }
      this.openModalFromQuery(modal);
    });
  }

  denominationDescription(value: string): string {
    const labels: Record<string, string> = {
      '200': 'Two Hundred Cedis',
      '100': 'One Hundred Cedis',
      '50': 'Fifty Cedis',
      '20': 'Twenty Cedis',
      '10': 'Ten Cedis',
      '5': 'Five Cedis',
      '2': 'Two Cedis',
      '1': 'One Cedi',
    };
    return labels[value] ?? value;
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
    this.selectedCurrency.set(value);
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
      const query = this.selectedCurrency()
        ? { queryParams: { currency: this.selectedCurrency() } }
        : undefined;
      void this.router.navigate(['/cash-deposit'], query);
      return;
    }

    if (label === 'Cash Withdrawal') {
      const query = this.selectedCurrency()
        ? { queryParams: { currency: this.selectedCurrency() } }
        : undefined;
      void this.router.navigate(['/cash-withdrawal'], query);
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

  onRequestCashSubmitted(payload: { currency: string; amount: string; requestingFrom: string }): void {
    this.feedbackMessage.set(
      `Request ${payload.amount} ${payload.currency} from ${payload.requestingFrom} — listed under Ungranted Cash Request until vault issues denominations.`,
    );
  }

  onTransferCashSubmitted(payload: { currency: string; vault: string; amount: number }): void {
    this.feedbackMessage.set(
      `Transfer to ${payload.vault} for ${payload.amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${payload.currency} — see Pending Cash Out until vault confirms.`,
    );
  }

  onPendingCashAccepted(amount: number): void {
    this.feedbackMessage.set(
      `Pending cash in of ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} accepted and added to till.`,
    );
  }

  onPendingCashRejected(): void {
    // Modal closed; no toast needed.
  }

  onPendingCashOutCancelled(amount: number): void {
    this.feedbackMessage.set(
      `Vault transfer cancelled (${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} returned to till).`,
    );
  }
}
