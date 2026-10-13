import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { formatBusinessDate } from '../../shared/business-date';
import { CashRequestRow, CashRequestStore } from '../../shared/cash-request.store';
import { CashOutTransfer, CashTransferStore } from '../../shared/cash-transfer.store';
import { DEFAULT_DENOMS, DenominationLine, TillStore } from '../../shared/till.store';
import { VaultStore } from '../../shared/vault.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';

interface IssueRow {
  denomination: string;
  quantity: number;
}

@Component({
  selector: 'app-vault',
  imports: [DecimalPipe, MessagePopup],
  templateUrl: './vault.html',
  styleUrl: './vault.css',
})
export class Vault {
  readonly vaultStore = inject(VaultStore);
  readonly cashRequestStore = inject(CashRequestStore);
  readonly cashTransferStore = inject(CashTransferStore);
  private readonly tillStore = inject(TillStore);

  readonly screenTitle = 'Vault';
  readonly activityCode = 'VVLT';

  readonly currentDate = formatBusinessDate();
  readonly businessDate = formatBusinessDate();
  readonly userId = 'VAULT01';
  readonly branch = 'HEAD OFFICE';

  readonly currencies = ['GHANA CEDIS', 'US DOLLAR', 'EURO', 'POUND STERLING'];
  readonly selectedCurrency = signal('');
  readonly feedbackMessage = signal('');
  readonly activePanel = signal<'none' | 'issue' | 'receive'>('none');

  readonly issuingRequest = signal<CashRequestRow | null>(null);
  readonly issueRows = signal<IssueRow[]>([]);
  readonly issueFeedback = signal('');

  readonly reviewingTransfer = signal<CashOutTransfer | null>(null);

  readonly awaitingRequests = this.cashRequestStore.awaitingVaultRequests;
  readonly awaitingTransfers = this.cashTransferStore.awaitingVaultTransfers;

  readonly pendingWorkAmount = computed(
    () =>
      this.awaitingRequests().reduce((sum, row) => sum + row.transAmount, 0) +
      this.awaitingTransfers().reduce((sum, row) => sum + row.total, 0),
  );

  readonly issueLines = computed<DenominationLine[]>(() =>
    this.issueRows()
      .filter((row) => row.quantity > 0)
      .map((row) => ({
        denomination: row.denomination,
        quantity: row.quantity,
        amount: row.quantity * Number(row.denomination),
      })),
  );

  readonly issueTotal = computed(() =>
    this.issueLines().reduce((sum, line) => sum + line.amount, 0),
  );

  readonly issueTallies = computed(() => {
    const request = this.issuingRequest();
    return !!request && this.issueTotal() === request.transAmount;
  });

  onCurrencyChange(value: string): void {
    this.selectedCurrency.set(value);
    this.feedbackMessage.set(
      value ? `Vault currency set to ${value}.` : 'Tap to select currency.',
    );
  }

  onAction(label: string): void {
    if (label === 'Issue to Teller') {
      this.openIssueQueue();
      return;
    }

    if (label === 'Receive from Teller') {
      this.openReceiveQueue();
      return;
    }

    this.feedbackMessage.set(`${label} opened.`);
  }

  openIssueQueue(): void {
    this.activePanel.set('issue');
    this.issuingRequest.set(null);
    this.issueFeedback.set('');
  }

  openReceiveQueue(): void {
    this.activePanel.set('receive');
    this.reviewingTransfer.set(null);
  }

  closePanel(): void {
    this.activePanel.set('none');
    this.issuingRequest.set(null);
    this.reviewingTransfer.set(null);
    this.issueRows.set([]);
    this.issueFeedback.set('');
  }

  startIssue(request: CashRequestRow): void {
    const suggested = this.tillStore.breakIntoDenominations(request.transAmount);
    const qtyMap = new Map(suggested.map((line) => [line.denomination, line.quantity]));

    this.issuingRequest.set(request);
    this.issueRows.set(
      DEFAULT_DENOMS.map((denom) => ({
        denomination: String(denom),
        quantity: qtyMap.get(String(denom)) ?? 0,
      })),
    );
    this.issueFeedback.set('');
  }

  cancelIssue(): void {
    this.issuingRequest.set(null);
    this.issueRows.set([]);
    this.issueFeedback.set('');
  }

  onIssueQuantityInput(denomination: string, value: string): void {
    const parsed = Number(value);
    const quantity = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    const available = this.vaultStore.availableQuantity(denomination);
    const capped = Math.min(quantity, available);

    this.issueRows.update((rows) =>
      rows.map((row) =>
        row.denomination === denomination ? { ...row, quantity: capped } : row,
      ),
    );

    if (quantity > available) {
      this.issueFeedback.set(`Only ${available} available for denomination ${denomination}.`);
    }
  }

  sendIssue(): void {
    const request = this.issuingRequest();
    if (!request) {
      return;
    }

    const lines = this.issueLines();
    if (lines.length === 0) {
      this.issueFeedback.set('Enter denominations that total the requested amount.');
      return;
    }

    if (!this.issueTallies()) {
      this.issueFeedback.set('Denomination total must match the requested amount.');
      return;
    }

    if (!this.vaultStore.canIssue(lines)) {
      this.issueFeedback.set('Vault does not have enough notes/coins for this issue.');
      return;
    }

    const issued = this.cashRequestStore.issueFromVault(request.id, lines);
    if (!issued) {
      this.issueFeedback.set('Unable to issue this request. Refresh and try again.');
      return;
    }

    this.vaultStore.recordIssue(request.batchNo, request.teller, request.transAmount, lines);
    this.feedbackMessage.set(
      `Issued ${request.batchNo} to ${request.teller}. It is now in their Pending Cash In.`,
    );
    this.cancelIssue();

    if (this.awaitingRequests().length === 0) {
      this.closePanel();
    }
  }

  rejectRequest(id: string): void {
    this.cashRequestStore.rejectFromVault(id);
    this.feedbackMessage.set('Cash request rejected and returned to the teller.');
    if (this.issuingRequest()?.id === id) {
      this.cancelIssue();
    }
  }

  openTransferReview(transfer: CashOutTransfer): void {
    this.reviewingTransfer.set(transfer);
  }

  cancelTransferReview(): void {
    this.reviewingTransfer.set(null);
  }

  acceptTransfer(id: string): void {
    const transfer = this.cashTransferStore.completeFromVault(id);
    if (!transfer) {
      this.feedbackMessage.set('Unable to accept this transfer.');
      return;
    }

    this.tillStore.addCashSent(transfer.total, transfer.lines);
    this.vaultStore.recordReceive(transfer.batchNo, transfer.teller, transfer.total, transfer.lines);
    this.feedbackMessage.set(
      `Transfer ${transfer.batchNo} confirmed. Cash Sent updated for ${transfer.teller}.`,
    );
    this.cancelTransferReview();

    if (this.awaitingTransfers().length === 0) {
      this.closePanel();
    }
  }

  rejectTransfer(id: string): void {
    const transfer = this.cashTransferStore.rejectFromVault(id);
    if (transfer) {
      this.tillStore.applyDenominationLines(transfer.lines);
    }
    this.feedbackMessage.set('Transfer rejected. Denominations returned to the teller till.');
    if (this.reviewingTransfer()?.id === id) {
      this.cancelTransferReview();
    }
  }

  movementLabel(type: string): string {
    switch (type) {
      case 'ISSUE':
        return 'Issue to teller';
      case 'RECEIVE':
        return 'Receive from teller';
      case 'SEAL':
        return 'Seal bag';
      case 'OPEN':
        return 'Open vault';
      default:
        return type;
    }
  }
}
