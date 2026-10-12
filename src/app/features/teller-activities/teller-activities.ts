import { DecimalPipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityStore } from '../../shared/activity.store';
import { formatBusinessDate } from '../../shared/business-date';
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
  private readonly activityStore = inject(ActivityStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly cashRequestStore = inject(CashRequestStore);
  readonly cashTransferStore = inject(CashTransferStore);
  readonly tillStore = inject(TillStore);

  readonly screenTitle = 'Teller Activities';
  readonly screenCaption = 'Branch operations workspace for till, cash movement, and teller actions.';
  readonly activityCode = 'TTTI';

  readonly currentDate = formatBusinessDate();
  readonly businessDate = formatBusinessDate();
  readonly userId = 'TESTTEL';
  readonly branch = 'HEAD OFFICE';

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

  constructor() {
    effect(() => {
      const selected = this.activityStore.selectedActivity();
      if (selected) {
        this.feedbackMessage.set(`Selected ${selected.code} — ${selected.label}`);
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const modal = params.get('modal');
      if (!modal) {
        return;
      }
      this.openModalFromQuery(modal);
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
    const row = this.cashTransferStore.addAwaitingVault({
      currency: 'GHANA CEDIS',
      vault: 'MAIN VAULT',
      lines: [
        { denomination: '200', quantity: 5, amount: 1000 },
        { denomination: '100', quantity: 10, amount: 1000 },
      ],
    });
    this.cashTransferStore.acceptFromVault(row.id);
  }

  onCurrencyChange(value: string): void {
    this.selectedCurrency.set(value);
    this.feedbackMessage.set(
      value ? `Currency set to ${value}.` : 'Tap to select currency.',
    );
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

    if (label === 'Teller Callover') {
      void this.router.navigateByUrl('/teller-callover');
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

    this.feedbackMessage.set(`${label} opened.`);
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
      `Cash request sent to vault: ${payload.amount} ${payload.currency} from ${payload.requestingFrom}.`,
    );
  }

  onTransferCashSubmitted(payload: { currency: string; vault: string; amount: number }): void {
    this.feedbackMessage.set(
      `Cash transfer sent to vault for check: ${payload.amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${payload.currency} to ${payload.vault}.`,
    );
  }

  onPendingCashAccepted(amount: number): void {
    this.feedbackMessage.set(
      `Pending cash in of ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} accepted and added to till.`,
    );
  }

  onPendingCashRejected(): void {
    this.feedbackMessage.set('Pending cash in rejected.');
  }

  onPendingCashOutAccepted(amount: number): void {
    this.feedbackMessage.set(
      `Pending cash out of ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} accepted and added to cash sent.`,
    );
  }

  onPendingCashOutRejected(): void {
    this.feedbackMessage.set('Pending cash out rejected.');
  }
}
