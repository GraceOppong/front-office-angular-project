import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { formatBusinessDate } from '../../shared/business-date';
import { CalloverStore } from '../../shared/callover.store';
import {
  CASH_TRANSACTION_MOCK_ACCOUNTS,
  formatCashAmount,
} from '../../shared/cash-transaction.mock';
import { MessagePopup } from '../../shared/message-popup/message-popup';

const DEFAULT_NARRATION = 'CASH WITHDRAWAL';

@Component({
  selector: 'app-cash-withdrawal',
  imports: [RouterLink, LucidePlus, MessagePopup],
  templateUrl: './cash-withdrawal.html',
  styleUrl: '../cash-deposit/cash-deposit.css',
})
export class CashWithdrawal {
  private readonly route = inject(ActivatedRoute);
  private readonly calloverStore = inject(CalloverStore);

  readonly sourceOfFundsOptions = ['Cash', 'Cheque', 'Transfer', 'Other'];
  readonly formatAmount = formatCashAmount;

  readonly debitAccount = signal('');
  readonly voucherDate = signal(formatBusinessDate());
  readonly amount = signal('');
  readonly voucherRef = signal('');
  readonly sourceOfFunds = signal('');
  readonly thirdParty = signal<'yes' | 'no'>('no');
  readonly narration1 = signal(DEFAULT_NARRATION);
  readonly narration2 = signal('');
  readonly feedbackMessage = signal('');
  readonly showSignaturePanel = signal(false);
  readonly workspaceCurrency = signal('GHANA CEDIS');

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const currency = params.get('currency');
      if (currency) {
        this.workspaceCurrency.set(currency);
      }
    });
  }

  readonly accountSnapshot = computed(() => {
    const key = this.debitAccount().trim();
    if (!key) {
      return null;
    }
    return CASH_TRANSACTION_MOCK_ACCOUNTS[key] ?? null;
  });

  readonly accountName = computed(() => this.accountSnapshot()?.accountName ?? '');

  readonly displayCurrency = computed(
    () => this.accountSnapshot()?.currency ?? this.workspaceCurrency(),
  );

  onDebitAccountInput(value: string): void {
    this.debitAccount.set(value);
  }

  onDebitAccountBlur(): void {
    const key = this.debitAccount().trim();
    if (!key) {
      return;
    }
    if (!CASH_TRANSACTION_MOCK_ACCOUNTS[key]) {
      this.feedbackMessage.set('Account not found. Try 1002003004 or 2003004005.');
      return;
    }
    this.feedbackMessage.set('');
  }

  onAmountInput(value: string): void {
    this.amount.set(value);
  }

  onVoucherRefInput(value: string): void {
    this.voucherRef.set(value);
  }

  onSourceOfFundsChange(value: string): void {
    this.sourceOfFunds.set(value);
  }

  onThirdPartyChange(value: 'yes' | 'no'): void {
    this.thirdParty.set(value);
  }

  onNarration1Input(value: string): void {
    this.narration1.set(value);
  }

  onNarration2Input(value: string): void {
    this.narration2.set(value);
  }

  onNew(): void {
    this.debitAccount.set('');
    this.voucherDate.set(formatBusinessDate());
    this.amount.set('');
    this.voucherRef.set('');
    this.sourceOfFunds.set('');
    this.thirdParty.set('no');
    this.narration1.set(DEFAULT_NARRATION);
    this.narration2.set('');
    this.showSignaturePanel.set(false);
    this.feedbackMessage.set('Form cleared for a new cash withdrawal.');
  }

  onSubmit(): void {
    const account = this.debitAccount().trim();
    const amountValue = Number(this.amount());
    const narration = this.narration1().trim();

    if (!account) {
      this.feedbackMessage.set('Debit Account is required.');
      return;
    }

    if (!this.accountSnapshot()) {
      this.feedbackMessage.set('Enter a valid debit account.');
      return;
    }

    if (!amountValue || amountValue <= 0) {
      this.feedbackMessage.set('Amount is required.');
      return;
    }

    if (!this.sourceOfFunds()) {
      this.feedbackMessage.set('Select a source of funds.');
      return;
    }

    if (!narration) {
      this.feedbackMessage.set('Narration 1 is required.');
      return;
    }

    const snapshot = this.accountSnapshot()!;
    const calloverInput = {
      accountNumber: account,
      accountName: snapshot.accountName,
      amount: amountValue,
      voucherRef: this.voucherRef().trim(),
      narration,
      voucherDate: this.voucherDate(),
      thirdParty: this.thirdParty() === 'yes',
    };

    const row = this.calloverStore.addCashWithdrawal(calloverInput);

    if (this.thirdParty() === 'yes') {
      this.feedbackMessage.set(
        `Third-party cash withdrawal of ${amountValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} submitted for verification. It is listed in Teller Callover as ${row.transNo}.`,
      );
      return;
    }

    this.feedbackMessage.set(
      `Cash withdrawal of ${amountValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} posted from ${account}. It is listed in Teller Callover as ${row.transNo}.`,
    );
  }

  openSignature(): void {
    this.showSignaturePanel.update((open) => !open);
    this.feedbackMessage.set(
      this.showSignaturePanel() ? 'Signature capture opened.' : 'Signature capture closed.',
    );
  }

  openUnclearedDetail(): void {
    this.feedbackMessage.set('Uncleared balance detail is not available in this demo.');
  }

  openBlockDetail(): void {
    this.feedbackMessage.set('Block amount detail is not available in this demo.');
  }
}
