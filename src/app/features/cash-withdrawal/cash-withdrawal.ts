import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatBusinessDate } from '../../shared/business-date';
import { CalloverStore, TELLER_CALLOVER_JOURNAL_TITLE } from '../../shared/callover.store';
import { TillStore } from '../../shared/till.store';
import { formatCashAmount, resolveCashTransactionAccount } from '../../shared/cash-transaction.mock';
import { MessagePopup } from '../../shared/message-popup/message-popup';
import { AmlThirdPartyModal } from '../../shared/aml-third-party-modal/aml-third-party-modal';
import {
  AmlThirdPartyDetails,
  createEmptyAmlThirdParty,
} from '../../shared/aml-third-party.model';

const DEFAULT_NARRATION = 'CASH WITHDRAWAL';

@Component({
  selector: 'app-cash-withdrawal',
  imports: [RouterLink, MessagePopup, AmlThirdPartyModal],
  templateUrl: './cash-withdrawal.html',
  styleUrl: '../cash-deposit/cash-deposit.css',
})
export class CashWithdrawal {
  private readonly route = inject(ActivatedRoute);
  private readonly calloverStore = inject(CalloverStore);
  private readonly tillStore = inject(TillStore);

  readonly sourceOfFundsOptions = ['Cash', 'Cheque', 'Transfer', 'Other'];
  readonly formatAmount = formatCashAmount;

  readonly debitAccount = signal('');
  readonly voucherDate = signal(formatBusinessDate());
  readonly amount = signal('');
  readonly voucherRef = signal('');
  readonly sourceOfFunds = signal('');
  readonly thirdParty = signal<'yes' | 'no'>('no');
  readonly showAmlThirdPartyModal = signal(false);
  readonly amlThirdPartyDetails = signal<AmlThirdPartyDetails>(createEmptyAmlThirdParty());
  readonly amlThirdPartyCaptured = signal(false);
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
    return resolveCashTransactionAccount(key);
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
    if (!resolveCashTransactionAccount(key)) {
      this.feedbackMessage.set('Enter a valid 10-digit account number.');
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
    if (value === 'yes') {
      this.thirdParty.set('yes');
      this.showAmlThirdPartyModal.set(true);
      return;
    }
    this.thirdParty.set('no');
    this.amlThirdPartyCaptured.set(false);
    this.amlThirdPartyDetails.set(createEmptyAmlThirdParty());
    this.showAmlThirdPartyModal.set(false);
  }

  openAmlThirdPartyModal(): void {
    this.showAmlThirdPartyModal.set(true);
  }

  onAmlThirdPartySaved(details: AmlThirdPartyDetails): void {
    this.amlThirdPartyDetails.set(details);
    this.amlThirdPartyCaptured.set(true);
    this.thirdParty.set('yes');
    this.showAmlThirdPartyModal.set(false);
    this.feedbackMessage.set('');
  }

  onAmlThirdPartyCancelled(): void {
    this.thirdParty.set('no');
    this.amlThirdPartyCaptured.set(false);
    this.amlThirdPartyDetails.set(createEmptyAmlThirdParty());
    this.showAmlThirdPartyModal.set(false);
  }

  onNarration1Input(value: string): void {
    this.narration1.set(value);
  }

  onNarration2Input(value: string): void {
    this.narration2.set(value);
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

    if (this.thirdParty() === 'yes' && !this.amlThirdPartyCaptured()) {
      this.feedbackMessage.set('Complete AML Third Party details before submitting.');
      this.showAmlThirdPartyModal.set(true);
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

    const lines = this.tillStore.breakIntoDenominations(amountValue);
    if (this.thirdParty() !== 'yes' && !this.tillStore.canRemoveLines(lines)) {
      this.feedbackMessage.set('Till does not have enough cash for this withdrawal.');
      return;
    }

    const row = this.calloverStore.addCashWithdrawal(calloverInput);

    if (this.thirdParty() !== 'yes') {
      this.tillStore.removeDenominationLines(lines);
      this.tillStore.addCashSent(amountValue, lines);
    }

    if (this.thirdParty() === 'yes') {
      this.feedbackMessage.set(
        `Third-party cash withdrawal of ${amountValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} submitted for verification. It is listed in ${TELLER_CALLOVER_JOURNAL_TITLE} as ${row.transNo}.`,
      );
      return;
    }

    this.feedbackMessage.set(
      `Cash withdrawal of ${amountValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} posted from ${account}. It is listed in ${TELLER_CALLOVER_JOURNAL_TITLE} as ${row.transNo}.`,
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
