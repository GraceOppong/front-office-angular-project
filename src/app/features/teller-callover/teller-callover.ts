import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideFileSpreadsheet, LucideFileType, LucideTrash } from '@lucide/angular';
import { CalloverRow, CalloverStore } from '../../shared/callover.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';

const PAGE_SIZE_OPTIONS = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'All', value: 0 },
] as const;

@Component({
  selector: 'app-teller-callover',
  imports: [DecimalPipe, RouterLink, LucideFileSpreadsheet, LucideFileType, LucideTrash, MessagePopup],
  templateUrl: './teller-callover.html',
  styleUrl: './teller-callover.css',
})
export class TellerCallover {
  private readonly router = inject(Router);
  readonly calloverStore = inject(CalloverStore);

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly pageSize = signal(10);
  readonly accountNumber = signal('');
  readonly transactionNumber = signal('');
  readonly transactionDetails = signal('');
  readonly feedbackMessage = signal('');
  readonly selectedTransaction = signal<CalloverRow | null>(null);
  readonly detailsPanel = signal<'none' | 'voucher' | 'signature'>('none');
  readonly currentPage = signal(1);

  readonly filteredRows = computed(() => {
    const account = this.accountNumber().trim().toLowerCase();
    const transNo = this.transactionNumber().trim().toLowerCase();
    const details = this.transactionDetails().trim().toLowerCase();

    return this.calloverStore.rows().filter((row) => {
      const matchAccount =
        !account ||
        row.acctLink.toLowerCase().includes(account) ||
        row.accountNumber.toLowerCase().includes(account) ||
        row.accountDescription.toLowerCase().includes(account);
      const matchTrans =
        !transNo ||
        row.transNo.toLowerCase().includes(transNo) ||
        row.batchNo.toLowerCase().includes(transNo);
      const matchDetails = !details || row.transactionDetails.toLowerCase().includes(details);
      return matchAccount && matchTrans && matchDetails;
    });
  });

  readonly effectivePageSize = computed(() => {
    const size = this.pageSize();
    const total = this.filteredRows().length;
    return size === 0 ? Math.max(total, 1) : size;
  });

  readonly showPagination = computed(() => this.pageSize() !== 0 && this.filteredRows().length > this.pageSize());

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / this.effectivePageSize())),
  );

  readonly pagedRows = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.effectivePageSize();
    const start = (page - 1) * size;
    return this.filteredRows().slice(start, start + size);
  });

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  readonly count = computed(() => this.filteredRows().length);
  readonly tickedCount = computed(() => this.filteredRows().filter((row) => row.ticked).length);
  readonly allTicked = computed(
    () => this.filteredRows().length > 0 && this.tickedCount() === this.filteredRows().length,
  );

  readonly pageAllTicked = computed(
    () => this.pagedRows().length > 0 && this.pagedRows().every((row) => row.ticked),
  );

  onAccountInput(value: string): void {
    this.accountNumber.set(value);
    this.currentPage.set(1);
  }

  onTransactionNumberInput(value: string): void {
    this.transactionNumber.set(value);
    this.currentPage.set(1);
  }

  onTransactionDetailsInput(value: string): void {
    this.transactionDetails.set(value);
    this.currentPage.set(1);
  }

  onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
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

  deleteRow(id: string): void {
    const row = this.calloverStore.rows().find((item) => item.id === id);
    this.calloverStore.deleteRow(id);

    if (this.selectedTransaction()?.id === id) {
      this.closeDetails();
    }

    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }

    this.feedbackMessage.set(
      row ? `Deleted transaction ${row.transNo}.` : 'Transaction deleted.',
    );
  }

  toggleTick(id: string, checked: boolean): void {
    this.calloverStore.setTick(id, checked);
  }

  toggleAll(checked: boolean): void {
    for (const row of this.pagedRows()) {
      this.toggleTick(row.id, checked);
    }
  }

  onSubmit(): void {
    const total = this.filteredRows().length;
    const ticked = this.tickedCount();

    if (total === 0) {
      this.feedbackMessage.set('No transactions available for callover.');
      return;
    }

    if (ticked === 0) {
      this.feedbackMessage.set('Tick at least one transaction to continue.');
      return;
    }

    this.feedbackMessage.set(
      ticked === total
        ? 'All visible transactions tallied and submitted for callover.'
        : `${ticked} of ${total} transactions submitted for callover.`,
    );
  }

  async downloadExcel(): Promise<void> {
    const rows = this.exportRows();
    if (!rows) {
      return;
    }

    const XLSX = await import('xlsx');
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Teller Callover');
    XLSX.writeFile(book, 'teller-callover.xlsx');
    this.feedbackMessage.set(`Downloaded ${rows.length} transactions as Excel.`);
  }

  async downloadPdf(): Promise<void> {
    const rows = this.exportRows();
    if (!rows) {
      return;
    }

    const { jsPDF } = await import('jspdf');
    const { autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Teller Callover', 40, 36);
    autoTable(doc, {
      startY: 52,
      head: [Object.keys(rows[0])],
      body: rows.map((row) => Object.values(row)),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [21, 101, 168] },
      columnStyles: { 3: { halign: 'right' } },
    });
    doc.save('teller-callover.pdf');
    this.feedbackMessage.set(`Downloaded ${rows.length} transactions as PDF.`);
  }

  private exportRows(): Record<string, string>[] | null {
    const rows = this.filteredRows();
    if (rows.length === 0) {
      this.feedbackMessage.set('No transactions to download.');
      return null;
    }

    return rows.map((row) => ({
      'Batch No': row.batchNo,
      'Acct Link': row.acctLink,
      'Account Description': row.accountDescription,
      Amount: row.amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      'Transaction Details': row.transactionDetails,
      'Trans No': row.transNo,
      'Callover By': row.calloverBy || '—',
      'Callover Date/Time': row.calloverDateTime || '—',
      Ticked: row.ticked ? 'Yes' : 'No',
    }));
  }

  goBack(): void {
    void this.router.navigateByUrl('/teller-activities');
  }
}
