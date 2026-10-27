import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  businessDateFromDmyDateInput,
  finalizeVoucherDateInput,
  maskDmyInput,
} from '../../shared/business-date';
import { CalloverStore, TELLER_CALLOVER_JOURNAL_TITLE } from '../../shared/callover.store';
import { TillStore } from '../../shared/till.store';
import {
  formatAmountOnBlur,
  parseAmountInput,
  restrictAmountTyping,
} from '../../shared/amount-input';
import {
  createCashAccountLookupHandlers,
  createCashAccountLookupSignals,
} from '../../shared/cash-account-lookup.mixin';
import { ACCOUNT_NUMBER_LENGTH } from '../../shared/cash-account-lookup';
import { formatCashAmount } from '../../shared/cash-transaction.mock';
import { MessagePopup } from '../../shared/message-popup/message-popup';
import { AmlThirdPartyModal } from '../../shared/aml-third-party-modal/aml-third-party-modal';
import { CashDenominationModal } from '../../shared/cash-denomination-modal/cash-denomination-modal';
import {
  denominationLinesMatchAmount,
  resolveDenominationTargetAmount,
} from '../../shared/cash-denomination.helpers';
import { DenominationLine } from '../../shared/till.store';
import { WorkspaceCurrencyStore, toCurrencyCode } from '../../shared/workspace-currency.store';
import {
  AmlThirdPartyDetails,
  createEmptyAmlThirdParty,
} from '../../shared/aml-third-party.model';
import { DateInput } from '../../shared/date-input/date-input';
import { FieldLabel } from '../../shared/field-label/field-label';
import { FieldInsetNotchDirective } from '../../shared/field-inset-notch.directive';
import { UsgFieldTypeDirective } from '../../shared/usg-field-type.directive';
import { calculateCashCharges } from '../../shared/cash-charges';

const DEFAULT_NARRATION = 'CASH DEPOSIT';
const SOURCE_OF_FUNDS_THRESHOLD = 1_000_000;

@Component({
  selector: 'app-cash-deposit',
  imports: [
    RouterLink,
    MessagePopup,
    AmlThirdPartyModal,
    CashDenominationModal,
    FieldLabel,
    DateInput,
    UsgFieldTypeDirective,
    FieldInsetNotchDirective,
  ],
  templateUrl: './cash-deposit.html',
  styleUrl: './cash-deposit.css',
})
export class CashDeposit {
  private readonly route = inject(ActivatedRoute);
  private readonly calloverStore = inject(CalloverStore);
  private readonly tillStore = inject(TillStore);
  readonly currencyStore = inject(WorkspaceCurrencyStore);

  readonly sourceOfFundsOptions = ['Cash', 'Cheque', 'Transfer', 'Other'];
  readonly formatAmount = formatCashAmount;
  readonly toCurrencyCode = toCurrencyCode;

  readonly creditAccount = signal('');
  readonly accountNumberMaxLength = ACCOUNT_NUMBER_LENGTH;
  private readonly accountLookup = createCashAccountLookupSignals();
  readonly accountLookupLoading = this.accountLookup.accountLookupLoading;
  readonly showAccountInformation = this.accountLookup.showAccountInformation;
  private readonly accountLookupHandlers = createCashAccountLookupHandlers(
    this.creditAccount,
    this.accountLookup,
    {
      onNarrationPrefill: (name) => this.narration2.set(name),
      onClearNarration: () => this.narration2.set(''),
      setFeedback: (message) => this.feedbackMessage.set(message),
    },
  );
  readonly accountSnapshot = this.accountLookupHandlers.accountSnapshot;
  readonly accountName = this.accountLookupHandlers.accountName;
  readonly voucherDateDmy = signal('');
  readonly voucherDate = computed(() => businessDateFromDmyDateInput(this.voucherDateDmy()));
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
  readonly showDenominationModal = signal(false);
  readonly denominationModalAmount = signal(0);
  readonly capturedDenominationLines = signal<DenominationLine[] | null>(null);

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.currencyStore.applyFromQueryParam(params.get('currency'));
    });
  }

  readonly sourceOfFundsEnabled = computed(() => {
    const amount = parseAmountInput(this.amount());
    return amount !== null && amount > SOURCE_OF_FUNDS_THRESHOLD;
  });

  readonly charges = computed(() => calculateCashCharges(parseAmountInput(this.amount())));
  readonly showCharges = computed(() => {
    const amount = parseAmountInput(this.amount());
    return amount !== null && amount > 0;
  });

  readonly displayPhone = computed(() => {
    if (this.thirdParty() === 'yes') {
      return this.amlThirdPartyCaptured() ? this.amlThirdPartyDetails().phone.trim() : '';
    }
    return this.showAccountInformation() ? (this.accountSnapshot()?.phone ?? '') : '';
  });

  onCreditAccountInput(value: string): void {
    this.accountLookupHandlers.onAccountNumberInput(value);
  }

  onVoucherDateInput(value: string): void {
    this.voucherDateDmy.set(maskDmyInput(value));
  }

  onVoucherDateBlur(): void {
    this.voucherDateDmy.set(finalizeVoucherDateInput(this.voucherDateDmy()));
  }

  onCreditAccountBlur(): void {
    this.accountLookupHandlers.onAccountNumberBlur();
  }

  onAmountInput(value: string): void {
    this.amount.set(restrictAmountTyping(value));
    this.capturedDenominationLines.set(null);
  }

  onAmountBlur(): void {
    this.amount.set(formatAmountOnBlur(this.amount()));
    if (!this.sourceOfFundsEnabled()) {
      this.sourceOfFunds.set('');
    }
  }

  onAmountEnter(event: Event): void {
    event.preventDefault();
    this.onAmountBlur();
    this.tryOpenDenominationModal();
  }

  tryOpenDenominationModal(): boolean {
    const amountValue = parseAmountInput(this.amount());
    const target = resolveDenominationTargetAmount(amountValue);
    if (target === null) {
      if (amountValue !== null && amountValue > 0) {
        this.feedbackMessage.set('Use a whole cash amount for denomination entry.');
      } else {
        this.feedbackMessage.set('Enter an amount before declaring denominations.');
      }
      return false;
    }

    this.denominationModalAmount.set(target);
    this.showDenominationModal.set(true);
    this.feedbackMessage.set('');
    return true;
  }

  onDenominationConfirmed(lines: DenominationLine[]): void {
    this.capturedDenominationLines.set(lines);
    this.showDenominationModal.set(false);
  }

  onDenominationCancelled(): void {
    this.showDenominationModal.set(false);
  }

  onVoucherRefInput(value: string): void {
    this.voucherRef.set(value);
  }

  onSourceOfFundsChange(value: string): void {
    if (!this.sourceOfFundsEnabled()) {
      return;
    }
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
    const account = this.creditAccount().trim();
    const amountValue = parseAmountInput(this.amount());
    const narration = this.narration1().trim();

    if (!account) {
      this.feedbackMessage.set('Credit Account is required.');
      return;
    }

    if (!this.accountSnapshot()) {
      this.feedbackMessage.set('Enter a valid credit account.');
      return;
    }

    if (!amountValue || amountValue <= 0) {
      this.feedbackMessage.set('Amount is required.');
      return;
    }

    if (this.sourceOfFundsEnabled() && !this.sourceOfFunds()) {
      this.feedbackMessage.set('Select a source of funds for amounts over 1,000,000.');
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

    const denominationTarget = resolveDenominationTargetAmount(amountValue);
    let lines = this.capturedDenominationLines();
    if (this.thirdParty() !== 'yes') {
      if (denominationTarget === null) {
        this.feedbackMessage.set('Use a whole cash amount for denomination entry.');
        return;
      }
      if (!denominationLinesMatchAmount(lines, denominationTarget)) {
        this.feedbackMessage.set('Press Enter on Amount to enter denominations that match the transaction.');
        this.tryOpenDenominationModal();
        return;
      }
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

    const row = this.calloverStore.addCashDeposit(calloverInput);

    if (this.thirdParty() !== 'yes' && lines) {
      this.tillStore.applyDenominationLines(lines);
      this.tillStore.addCashReceived(amountValue, lines);
      this.tillStore.recordCustomerDeposit(amountValue);
    }

    if (this.thirdParty() === 'yes') {
      this.feedbackMessage.set(
        `Third-party cash deposit of ${amountValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} submitted for verification. It is listed in ${TELLER_CALLOVER_JOURNAL_TITLE} as ${row.transNo}.`,
      );
      return;
    }

    this.feedbackMessage.set(
      `Cash deposit of ${amountValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} posted to ${account}. It is listed in ${TELLER_CALLOVER_JOURNAL_TITLE} as ${row.transNo}.`,
    );
  }

  openSignature(): void {
    this.showSignaturePanel.update((open) => !open);
  }

  openUnclearedDetail(): void {
    // Detail view not implemented in demo.
  }

  openBlockDetail(): void {
    // Detail view not implemented in demo.
  }
}
