import { CalloverRow } from './callover.store';
import { DenominationLine } from './till.store';

export const SAME_DAY_REVERSAL_PATH = '/same-day-reversal';

export interface SameDayReversalView {
  transNo: string;
  accountNumber: string;
  accountName: string;
  documentRef: string;
  amount: number;
  postingDate: string;
  transactionType: string;
  valueDate: string;
  transactionDetails1: string;
  transactionDetails2: string;
  denominations: DenominationLine[];
}

const TYPE_LABELS: Record<string, string> = {
  'CASH DEPOSIT': 'Cash Deposit',
  'CASH WITHDRAWAL': 'Cash Withdrawal',
  'CHEQUE DEPOSIT': 'Cheque Deposit',
  'CHEQUE WITHDRAWAL': 'Cheque Withdrawal',
  'CASH REQUEST ACCEPTED': 'Cash Request',
  'CASH TRANSFER OUT': 'Cash Transfer',
  'FX SALE': 'FX Sale',
  'FX PURCHASE': 'FX Purchase',
  'DENOMINATION EXCHANGE': 'Denomination Exchange',
};

function normalizeTransNo(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('TXN-')) {
    return trimmed;
  }
  if (/^\d+$/.test(trimmed)) {
    return `TXN-${trimmed}`;
  }
  return trimmed;
}

function transactionTypeLabel(details: string): string {
  const key = details.trim().toUpperCase();
  return TYPE_LABELS[key] ?? details;
}

function mapRowToView(
  row: CalloverRow,
  breakIntoDenominations: (total: number) => DenominationLine[],
): SameDayReversalView {
  const amount = Math.abs(row.amount);
  const details = row.transactionDetails.trim();
  const isCash =
    details.includes('CASH') ||
    details.includes('DENOMINATION') ||
    details === 'CASH REQUEST ACCEPTED';

  return {
    transNo: row.transNo,
    accountNumber: row.accountNumber,
    accountName: row.accountDescription,
    documentRef: row.documentRef || row.voucherNumber,
    amount,
    postingDate: row.postingDate,
    transactionType: transactionTypeLabel(details),
    valueDate: row.valueDate,
    transactionDetails1: details,
    transactionDetails2: `Batch ${row.batchNo} · Voucher ${row.voucherNumber}`,
    denominations: isCash && amount > 0 ? breakIntoDenominations(amount) : [],
  };
}

export function lookupSameDayReversal(
  transNoInput: string,
  calloverRows: CalloverRow[],
  breakIntoDenominations: (total: number) => DenominationLine[],
): SameDayReversalView | null {
  const normalized = normalizeTransNo(transNoInput);
  if (!normalized) {
    return null;
  }

  const row = calloverRows.find(
    (item) =>
      item.transNo.toUpperCase() === normalized ||
      item.transNo.toUpperCase() === normalizeTransNo(normalized),
  );

  if (!row) {
    return null;
  }

  return mapRowToView(row, breakIntoDenominations);
}

export function denominationDescription(value: string): string {
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
