import { TELLER_CALLOVER_JOURNAL_TITLE } from '../../shared/callover.store';

export function buildTellerInternalActionLabels(
  calloverTitle = TELLER_CALLOVER_JOURNAL_TITLE,
): string[] {
  return [
    'Cash Limit',
    'Request Cash',
    'Transfer Cash',
    'Denomination Exchange',
    calloverTitle,
  ];
}

export function buildTellerExternalActionLabels(): string[] {
  return [
    'Teller Enquiries',
    'Same Day Reversal',
    'Cash Deposit',
    'Cash Withdrawal',
    'Cheque Withdrawal',
    'Counter Cheque Withdrawal',
    'Email Withdrawal Instruction',
    'Multi Currency Deposit',
    'Multi Currency Withdrawal',
  ];
}
