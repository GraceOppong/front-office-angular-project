import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  formatAmountOnBlur,
  parseAmountInput,
  restrictAmountTyping,
} from '../../shared/amount-input';
import {
  CalloverRow,
  CalloverStore,
  TELLER_CALLOVER_JOURNAL_TITLE,
} from '../../shared/callover.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';

export type CalloverTransactionFilter =
  | 'all'
  | 'cheque-withdrawals'
  | 'cash-withdrawals'
  | 'cash-deposit'
  | 'cheque-deposits'
  | 'others';

const BUSINESS_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TRANSACTION_TYPE_OPTIONS: { id: CalloverTransactionFilter; label: string }[] = [
  { id: 'all', label: 'All transactions' },
  { id: 'cheque-withdrawals', label: 'Cheque withdrawals' },
  { id: 'cash-withdrawals', label: 'Cash withdrawals' },
  { id: 'cash-deposit', label: 'Cash deposit' },
  { id: 'cheque-deposits', label: 'Cheque deposits' },
  { id: 'others', label: 'Others' },
];

export type CalloverTransStatusFilter =
  | 'all'
  | 'reversed'
  | 'applied'
  | 'rejected'
  | 'unapproved'
  | 'approved';

const TRANS_STATUS_OPTIONS: { id: CalloverTransStatusFilter; label: string }[] = [
  { id: 'all', label: 'All statuses' },
  { id: 'reversed', label: 'Reversed' },
  { id: 'applied', label: 'Applied' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'unapproved', label: 'Unapproved' },
  { id: 'approved', label: 'Approved' },
];

@Component({
  selector: 'app-teller-callover',
  imports: [DecimalPipe, RouterLink, MessagePopup],
  templateUrl: './teller-callover.html',
  styleUrl: './teller-callover.css',
})
export class TellerCallover {
  readonly pageTitle = TELLER_CALLOVER_JOURNAL_TITLE;
  readonly calloverStore = inject(CalloverStore);

  constructor() {
    effect(() => {
      if (!this.calloverStore.calloverInitiated() && this.calloverView() === 'called-over') {
        this.calloverView.set('pending');
      }
    });
  }

  readonly transactionTypeOptions = TRANSACTION_TYPE_OPTIONS;
  readonly transStatusOptions = TRANS_STATUS_OPTIONS;
  readonly batchNumber = signal('');
  readonly accountNumber = signal('');
  readonly amountMin = signal('');
  readonly amountMax = signal('');
  readonly transactionDateFrom = signal('');
  readonly transactionDateTo = signal('');
  readonly transactionTypeFilter = signal<CalloverTransactionFilter>('all');
  readonly transStatusFilter = signal<CalloverTransStatusFilter>('all');
  private transStatusFilterBeforeInitiate: CalloverTransStatusFilter | null = null;
  readonly feedbackMessage = signal('');
  readonly selectedTransaction = signal<CalloverRow | null>(null);
  readonly detailsPanel = signal<'none' | 'voucher' | 'signature'>('none');
  readonly calloverView = signal<'pending' | 'called-over'>('pending');

  readonly filteredRows = computed(() => {
    const batch = this.batchNumber().trim().toLowerCase();
    const account = this.accountNumber().trim().toLowerCase();
    const min = this.parseFilterAmount(this.amountMin());
    const max = this.parseFilterAmount(this.amountMax());
    const typeFilter = this.transactionTypeFilter();
    const statusFilter = this.transStatusFilter();

    return this.calloverStore.rows().filter((row) => {
      const matchBatch = !batch || row.batchNo.toLowerCase().includes(batch);
      if (!matchBatch) {
        return false;
      }

      const matchAccount =
        !account || row.accountNumber.toLowerCase().includes(account);
      if (!matchAccount) {
        return false;
      }

      if (!this.matchesTransactionType(row, typeFilter)) {
        return false;
      }

      if (!this.matchesTransStatus(row, statusFilter)) {
        return false;
      }

      if (!this.matchesTransactionDate(row)) {
        return false;
      }

      if (min !== null || max !== null) {
        const amount = this.filterableAmount(row);
        if (amount === null) {
          return false;
        }
        if (min !== null && amount < min) {
          return false;
        }
        if (max !== null && amount > max) {
          return false;
        }
      }

      return true;
    });
  });

  readonly pendingRows = computed(() => this.filteredRows().filter((row) => !row.ticked));
  readonly calledOverRows = computed(() => this.filteredRows().filter((row) => row.ticked));

  readonly count = computed(() => this.filteredRows().length);
  readonly pendingCount = computed(() => this.pendingRows().length);
  readonly calledOverCount = computed(() => this.calledOverRows().length);

  readonly allTicked = computed(
    () => this.filteredRows().length > 0 && this.pendingCount() === 0,
  );

  readonly canInitiateCallover = computed(
    () => !this.calloverStore.calloverInitiated() && this.count() > 0,
  );

  readonly pendingTotalDebit = computed(() => this.sumDebit(this.pendingRows()));
  readonly pendingTotalCredit = computed(() => this.sumCredit(this.pendingRows()));
  readonly calledOverTotalDebit = computed(() => this.sumDebit(this.calledOverRows()));
  readonly calledOverTotalCredit = computed(() => this.sumCredit(this.calledOverRows()));

  onBatchNumberInput(value: string): void {
    this.batchNumber.set(value);
  }

  onAccountNumberInput(value: string): void {
    this.accountNumber.set(value);
  }

  onAmountMinInput(value: string): void {
    this.amountMin.set(restrictAmountTyping(value));
  }

  onAmountMaxInput(value: string): void {
    this.amountMax.set(restrictAmountTyping(value));
  }

  onAmountMinBlur(): void {
    this.amountMin.set(formatAmountOnBlur(this.amountMin()));
  }

  onAmountMaxBlur(): void {
    this.amountMax.set(formatAmountOnBlur(this.amountMax()));
  }

  onTransactionDateFromInput(value: string): void {
    this.transactionDateFrom.set(value);
  }

  onTransactionDateToInput(value: string): void {
    this.transactionDateTo.set(value);
  }

  setTransactionTypeFilter(value: CalloverTransactionFilter): void {
    this.transactionTypeFilter.set(value);
  }

  setTransStatusFilter(value: CalloverTransStatusFilter): void {
    if (this.calloverStore.calloverInitiated()) {
      return;
    }
    this.transStatusFilter.set(value);
  }

  transStatusLabel(row: CalloverRow): string {
    return (
      this.transStatusOptions.find((option) => option.id === row.transStatus)?.label ??
      row.transStatus
    );
  }

  showCalledOverScreen(): void {
    if (!this.calloverStore.calloverInitiated()) {
      return;
    }
    this.calloverView.set('called-over');
  }

  showPendingScreen(): void {
    this.calloverView.set('pending');
  }

  openDetails(row: CalloverRow): void {
    this.selectedTransaction.set(row);
    this.detailsPanel.set('none');
  }

  closeDetails(): void {
    this.selectedTransaction.set(null);
    this.detailsPanel.set('none');
  }

  openVoucherPanel(): void {
    this.detailsPanel.set('voucher');
  }

  openSignaturePanel(): void {
    this.detailsPanel.set('signature');
  }

  closeDetailsPanel(): void {
    this.detailsPanel.set('none');
  }

  toggleTick(id: string, checked: boolean): void {
    if (!this.calloverStore.calloverInitiated()) {
      return;
    }
    this.calloverStore.setTick(id, checked);
  }

  reverseTransaction(id: string): void {
    this.calloverStore.reverseTransaction(id);
  }

  private transactionCategory(row: CalloverRow): Exclude<CalloverTransactionFilter, 'all'> {
    const details = row.transactionDetails.toUpperCase();

    if (details.includes('CHEQUE') && details.includes('WITHDRAW')) {
      return 'cheque-withdrawals';
    }
    if (details.includes('CHEQUE') && details.includes('DEPOSIT')) {
      return 'cheque-deposits';
    }
    if (details.includes('CASH') && details.includes('WITHDRAW')) {
      return 'cash-withdrawals';
    }
    if (details.includes('CASH') && details.includes('DEPOSIT')) {
      return 'cash-deposit';
    }

    return 'others';
  }

  private matchesTransactionType(row: CalloverRow, filter: CalloverTransactionFilter): boolean {
    if (filter === 'all') {
      return true;
    }
    return this.transactionCategory(row) === filter;
  }

  private matchesTransStatus(row: CalloverRow, filter: CalloverTransStatusFilter): boolean {
    if (filter === 'all') {
      return true;
    }
    return row.transStatus === filter;
  }

  private matchesTransactionDate(row: CalloverRow): boolean {
    const from = this.parseIsoDateInput(this.transactionDateFrom());
    const to = this.parseIsoDateInput(this.transactionDateTo());
    if (from === null && to === null) {
      return true;
    }

    const rowDay = this.rowTransactionDay(row);
    if (rowDay === null) {
      return false;
    }
    if (from !== null && rowDay < from) {
      return false;
    }
    if (to !== null && rowDay > to) {
      return false;
    }
    return true;
  }

  private rowTransactionDay(row: CalloverRow): number | null {
    return (
      this.parseBusinessDateString(row.valueDate) ??
      this.parseBusinessDateString(row.postingDate) ??
      this.parseBusinessDateString(row.voucherDate)
    );
  }

  private parseBusinessDateString(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const match = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const monthIndex = BUSINESS_MONTHS.findIndex(
      (month) => month.toLowerCase() === match[2].toLowerCase(),
    );
    const year = Number(match[3]);
    if (monthIndex < 0 || !Number.isFinite(day) || !Number.isFinite(year)) {
      return null;
    }

    return Date.UTC(year, monthIndex, day);
  }

  private parseIsoDateInput(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }

    return Date.UTC(year, month - 1, day);
  }

  private parseFilterAmount(value: string): number | null {
    return parseAmountInput(value);
  }

  private filterableAmount(row: CalloverRow): number | null {
    const debit = this.debitAmount(row);
    const credit = this.creditAmount(row);
    if (debit !== null && credit !== null) {
      return Math.max(debit, credit);
    }
    return debit ?? credit ?? (Number.isFinite(row.amount) ? Math.abs(row.amount) : null);
  }

  private sumDebit(rows: CalloverRow[]): number {
    return rows.reduce((total, row) => total + (this.debitAmount(row) ?? 0), 0);
  }

  private sumCredit(rows: CalloverRow[]): number {
    return rows.reduce((total, row) => total + (this.creditAmount(row) ?? 0), 0);
  }

  debitAmount(row: CalloverRow): number | null {
    const fromDb = row.localEquivalentDb.trim();
    if (fromDb) {
      const parsed = Number(fromDb);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return row.amount < 0 ? Math.abs(row.amount) : null;
  }

  creditAmount(row: CalloverRow): number | null {
    const fromCr = row.localEquivalentCr.trim();
    if (fromCr) {
      const parsed = Number(fromCr);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return row.amount > 0 ? row.amount : null;
  }

  tickAllPending(checked: boolean): void {
    if (!this.calloverStore.calloverInitiated()) {
      return;
    }

    if (checked) {
      for (const row of this.pendingRows()) {
        this.toggleTick(row.id, true);
      }
      return;
    }

    this.uncheckAllCalledOver();
  }

  uncheckAllCalledOver(): void {
    for (const row of this.calledOverRows()) {
      this.toggleTick(row.id, false);
    }
  }

  onCalledOverCheckAll(checked: boolean): void {
    if (!checked) {
      this.uncheckAllCalledOver();
    }
  }

  onCancelCalloverInitiation(): void {
    if (!this.calloverStore.calloverInitiated()) {
      return;
    }

    this.calloverStore.cancelCalloverInitiation();
    this.calloverView.set('pending');
    if (this.transStatusFilterBeforeInitiate !== null) {
      this.transStatusFilter.set(this.transStatusFilterBeforeInitiate);
      this.transStatusFilterBeforeInitiate = null;
    }
  }

  onInitiateCallover(): void {
    const total = this.filteredRows().length;

    if (this.calloverStore.calloverInitiated()) {
      return;
    }

    if (total === 0) {
      this.feedbackMessage.set('No transactions available for callover.');
      return;
    }

    this.transStatusFilterBeforeInitiate = this.transStatusFilter();
    this.transStatusFilter.set('applied');
    this.calloverStore.initiateCallover();
  }

  async downloadExcel(): Promise<void> {
    if (!this.calloverStore.calloverInitiated()) {
      return;
    }

    const rows = this.exportRows();
    if (!rows) {
      return;
    }

    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, TELLER_CALLOVER_JOURNAL_TITLE);
    XLSX.writeFile(book, 'teller-callover-journal.xlsx');
  }

  async downloadPdf(): Promise<void> {
    if (!this.calloverStore.calloverInitiated()) {
      return;
    }

    const rows = this.exportRows();
    if (!rows) {
      return;
    }

    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text(TELLER_CALLOVER_JOURNAL_TITLE, 40, 36);
    autoTable(doc, {
      startY: 52,
      head: [Object.keys(rows[0])],
      body: rows.map((row) => Object.values(row)),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [21, 101, 168] },
      columnStyles: { 8: { halign: 'right' }, 9: { halign: 'right' } },
    });
    doc.save('teller-callover-journal.pdf');
  }

  private exportRows(): Record<string, string>[] | null {
    const rows = this.filteredRows();
    if (rows.length === 0) {
      this.feedbackMessage.set('No transactions to download.');
      return null;
    }

    return rows.map((row) => {
      const debit = this.debitAmount(row);
      const credit = this.creditAmount(row);
      return {
        'Batch No': row.batchNo,
        'Trans No': row.transNo,
        'Account No': row.accountNumber,
        'Account Description': row.accountDescription,
        Currency: row.currency,
        'Transaction Details': row.transactionDetails,
        'Trans Status':
          this.transStatusOptions.find((option) => option.id === row.transStatus)?.label ??
          row.transStatus,
        Debit:
          debit === null
            ? '—'
            : debit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
        Credit:
          credit === null
            ? '—'
            : credit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
        'Value Date': row.valueDate,
        Status: row.ticked ? 'Called over' : 'Pending',
        Ticked: row.ticked ? 'Yes' : 'No',
      };
    });
  }

}
