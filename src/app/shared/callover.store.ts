import { Injectable, signal } from '@angular/core';
import { formatBusinessDate } from './business-date';

export type CalloverTransStatus = 'reversed' | 'applied' | 'rejected' | 'unapproved' | 'approved';

export const TELLER_CALLOVER_JOURNAL_TITLE = 'Teller callover/journal';
export const TELLER_CALLOVER_JOURNAL_PATH = '/teller-callover/journal';

const SAMPLE_TRANS_STATUSES: CalloverTransStatus[] = [
  'applied',
  'approved',
  'unapproved',
  'rejected',
  'reversed',
];

export interface CalloverRow {
  id: string;
  batchNo: string;
  acctLink: string;
  accountDescription: string;
  amount: number;
  transactionDetails: string;
  transStatus: CalloverTransStatus;
  transNo: string;
  calloverBy: string;
  calloverDateTime: string;
  ticked: boolean;
  valueDate: string;
  voucherNumber: string;
  customerNo: string;
  accountNumber: string;
  currency: string;
  fcAmountDb: string;
  exchangeRate: string;
  localEquivalentDb: string;
  postingDate: string;
  voucherDate: string;
  postingSysTime: string;
  approvedBy: string;
  fcAmountCr: string;
  documentRef: string;
  localEquivalentCr: string;
}

export interface CashCalloverInput {
  accountNumber: string;
  accountName: string;
  amount: number;
  voucherRef: string;
  narration: string;
  voucherDate: string;
  thirdParty: boolean;
}

const SAMPLE_NAMES = [
  'AMA MENSAH - SAVINGS',
  'KOFI OWUSU - CURRENT',
  'HENRY AMOH - SAVINGS',
  'BRANCH FLOAT - TILL',
  'MAIN VAULT TRANSFER',
  'AKUA BOATENG - CURRENT',
  'YAW ASANTE - SAVINGS',
  'EFUA DARKO - CURRENT',
  'NANA ADJEI - SAVINGS',
  'SERWA ACHEAMPONG - CURRENT',
];

const SAMPLE_DETAILS = [
  'CASH DEPOSIT',
  'CASH WITHDRAWAL',
  'CHEQUE DEPOSIT',
  'CHEQUE WITHDRAWAL',
  'CASH REQUEST ACCEPTED',
  'CASH TRANSFER OUT',
  'FX SALE',
  'FX PURCHASE',
  'DENOMINATION EXCHANGE',
];

function pickSampleTransStatus(index: number): CalloverTransStatus {
  const spread = (index * 3 + Math.floor(index / 7) * 2) % SAMPLE_TRANS_STATUSES.length;
  return SAMPLE_TRANS_STATUSES[spread];
}

function buildSampleRows(): CalloverRow[] {
  return Array.from({ length: 120 }, (_, index) => {
    const n = index + 1;
    const isDebit = n % 3 === 0;
    const amount = isDebit ? -(500 + n * 75) : 400 + n * 90;
    const details = SAMPLE_DETAILS[index % SAMPLE_DETAILS.length];
    const voucher = details.split(' ')[0].slice(0, 4).toUpperCase();

    return {
      id: `sample-${n}`,
      batchNo: `BCH-${10020 + n}`,
      acctLink: `001${String(2000000 + n * 137).padStart(7, '0')}`,
      accountDescription: SAMPLE_NAMES[index % SAMPLE_NAMES.length],
      amount,
      transactionDetails: details,
      transStatus: pickSampleTransStatus(index),
      transNo: `TXN-${88010 + n}`,
      calloverBy: '',
      calloverDateTime: '',
      ticked: false,
      valueDate: '07-Oct-2026',
      voucherNumber: voucher,
      customerNo: `0050${String(10 + (n % 40)).padStart(2, '0')}`,
      accountNumber: `001${String(300000000 + n * 911).padStart(9, '0')}`,
      currency: details.includes('FX') ? 'USD' : 'GHS',
      fcAmountDb: '',
      exchangeRate: '1',
      localEquivalentDb: isDebit ? String(Math.abs(amount)) : '',
      postingDate: '07-Oct-2026',
      voucherDate: '07-Oct-2026',
      postingSysTime: `${String(8 + (n % 8)).padStart(2, '0')}:${String((n * 7) % 60).padStart(2, '0')}:${String((n * 11) % 60).padStart(2, '0')}`,
      approvedBy: 'TESTTEL',
      fcAmountCr: '',
      documentRef: voucher,
      localEquivalentCr: !isDebit ? String(Math.abs(amount)) : '',
    };
  });
}

function postingTimeStamp(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

@Injectable({ providedIn: 'root' })
export class CalloverStore {
  private readonly sequence = signal(1);

  readonly rows = signal<CalloverRow[]>(buildSampleRows());
  readonly calloverInitiated = signal(false);

  private preInitiateSnapshot: Map<
    string,
    Pick<CalloverRow, 'transStatus' | 'ticked' | 'calloverBy' | 'calloverDateTime'>
  > | null = null;

  addCashDeposit(input: CashCalloverInput): CalloverRow {
    return this.prependRow(this.buildCashRow('deposit', input));
  }

  addCashWithdrawal(input: CashCalloverInput): CalloverRow {
    return this.prependRow(this.buildCashRow('withdrawal', input));
  }

  deleteRow(id: string): void {
    this.rows.update((rows) => rows.filter((row) => row.id !== id));
  }

  initiateCallover(): void {
    this.preInitiateSnapshot = new Map(
      this.rows().map((row) => [
        row.id,
        {
          transStatus: row.transStatus,
          ticked: row.ticked,
          calloverBy: row.calloverBy,
          calloverDateTime: row.calloverDateTime,
        },
      ]),
    );

    this.calloverInitiated.set(true);
  }

  cancelCalloverInitiation(): void {
    const snapshot = this.preInitiateSnapshot;

    if (snapshot) {
      this.rows.update((rows) =>
        rows.map((row) => {
          const previous = snapshot.get(row.id);
          if (!previous) {
            return {
              ...row,
              ticked: false,
              calloverBy: '',
              calloverDateTime: '',
            };
          }

          return {
            ...row,
            transStatus: previous.transStatus,
            ticked: previous.ticked,
            calloverBy: previous.calloverBy,
            calloverDateTime: previous.calloverDateTime,
          };
        }),
      );
    }

    this.preInitiateSnapshot = null;
    this.calloverInitiated.set(false);
  }

  reverseTransaction(id: string): void {
    if (!this.calloverInitiated()) {
      return;
    }

    this.rows.update((rows) =>
      rows.map((row) =>
        row.id === id && row.transStatus !== 'reversed'
          ? { ...row, transStatus: 'reversed' as CalloverTransStatus }
          : row,
      ),
    );
  }

  setTick(id: string, checked: boolean): void {
    if (!this.calloverInitiated()) {
      return;
    }

    const now = new Date();
    const stamp = now.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    this.rows.update((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              ticked: checked,
              calloverBy: checked ? 'TESTTEL' : '',
              calloverDateTime: checked ? stamp : '',
            }
          : row,
      ),
    );
  }

  private prependRow(row: CalloverRow): CalloverRow {
    this.rows.update((rows) => [row, ...rows]);
    return row;
  }

  private buildCashRow(kind: 'deposit' | 'withdrawal', input: CashCalloverInput): CalloverRow {
    const seq = this.sequence();
    this.sequence.set(seq + 1);

    const signedAmount =
      kind === 'withdrawal' ? -Math.abs(input.amount) : Math.abs(input.amount);
    const baseLabel = kind === 'deposit' ? 'CASH DEPOSIT' : 'CASH WITHDRAWAL';
    const transactionDetails = input.thirdParty ? `${baseLabel} (THIRD PARTY)` : baseLabel;
    const voucherNumber = (input.voucherRef.trim() || baseLabel.slice(0, 4)).toUpperCase();
    const businessDate = input.voucherDate || formatBusinessDate();
    const amountText = Math.abs(signedAmount).toFixed(2);
    const isDebit = signedAmount < 0;

    return {
      id: `cash-${kind}-${Date.now()}-${seq}`,
      batchNo: `BCH-${91000 + seq}`,
      acctLink: input.accountNumber,
      accountDescription: input.accountName,
      amount: signedAmount,
      transactionDetails,
      transStatus: SAMPLE_TRANS_STATUSES[seq % SAMPLE_TRANS_STATUSES.length],
      transNo: `TXN-${99000 + seq}`,
      calloverBy: '',
      calloverDateTime: '',
      ticked: false,
      valueDate: businessDate,
      voucherNumber,
      customerNo: input.accountNumber.slice(0, 8),
      accountNumber: input.accountNumber,
      currency: 'GHS',
      fcAmountDb: '',
      exchangeRate: '1',
      localEquivalentDb: isDebit ? amountText : '',
      postingDate: businessDate,
      voucherDate: businessDate,
      postingSysTime: postingTimeStamp(),
      approvedBy: 'TESTTEL',
      fcAmountCr: '',
      documentRef: input.voucherRef.trim() || voucherNumber,
      localEquivalentCr: !isDebit ? amountText : '',
    };
  }
}
