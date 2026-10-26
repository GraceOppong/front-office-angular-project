import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  input,
  linkedSignal,
  output,
  TemplateRef,
  contentChild,
} from '@angular/core';
import { UsgTablePagination } from '../usg-table-pagination/usg-table-pagination';
import { usgPageCount } from '../usg-table-pagination/usg-pagination.util';
import {
  UsgDataTableAction,
  UsgDataTableActionEvent,
  UsgDataTableColumn,
} from './usg-data-table.model';

type Row = Record<string, unknown>;

@Component({
  selector: 'app-usg-data-table',
  imports: [NgTemplateOutlet, UsgTablePagination],
  templateUrl: './usg-data-table.html',
  styleUrl: './usg-data-table.css',
})
export class UsgDataTable {
  readonly columns = input.required<UsgDataTableColumn[]>();
  readonly data = input.required<Row[]>();
  readonly rowKey = input.required<string>();
  readonly pagination = input(true);
  readonly pageSizeOptions = input<number[]>([5, 10, 25]);
  readonly defaultPageSize = input(5);
  readonly totalRecords = input<number | null>(null);
  readonly page = input(1);
  readonly loading = input(false);
  readonly emptyTitle = input('No records found');
  readonly emptyDescription = input('');
  readonly actions = input<UsgDataTableAction[]>([]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly rowClick = output<Row>();
  readonly action = output<UsgDataTableActionEvent>();

  readonly rowTemplate = contentChild<TemplateRef<{ $implicit: Row }>>('rowCells');

  readonly pageSize = linkedSignal(() => this.defaultPageSize());
  readonly currentPage = linkedSignal(() => Math.max(1, this.page()));

  readonly sortedKey = linkedSignal<string | null>(() => null);
  readonly sortDir = linkedSignal<'asc' | 'desc'>(() => 'asc');

  readonly isServerPaged = computed(() => this.totalRecords() !== null);

  readonly processedRows = computed(() => {
    let rows = [...this.data()];
    const key = this.sortedKey();
    if (key) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av === bv) {
          return 0;
        }
        if (av === null || av === undefined) {
          return 1;
        }
        if (bv === null || bv === undefined) {
          return -1;
        }
        return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
      });
    }
    return rows;
  });

  readonly totalCount = computed(() => this.totalRecords() ?? this.processedRows().length);

  readonly pageCount = computed(() => {
    if (!this.pagination()) {
      return 1;
    }
    return usgPageCount(this.totalCount(), this.pageSize());
  });

  readonly visibleRows = computed(() => {
    const rows = this.processedRows();
    if (!this.pagination() || this.isServerPaged()) {
      return rows;
    }
    const start = (this.currentPage() - 1) * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  });

  trackRow = (row: Row): string => String(row[this.rowKey()] ?? '');

  cellValue(row: Row, column: UsgDataTableColumn): string {
    const raw = row[column.key];
    if (raw === null || raw === undefined || raw === '') {
      return '—';
    }
    if (column.format === 'amount' && typeof raw === 'number') {
      return raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(raw);
  }

  thClass(column: UsgDataTableColumn): string {
    const parts = ['usg-dt-th'];
    if (
      column.align === 'right' ||
      column.format === 'amount' ||
      column.format === 'debit' ||
      column.format === 'credit' ||
      column.format === 'balance'
    ) {
      parts.push('is-amount');
    }
    if (column.cellClass) {
      parts.push(column.cellClass);
    }
    return parts.join(' ');
  }

  tdClass(column: UsgDataTableColumn): string {
    const parts = ['usg-dt-td'];
    if (
      column.align === 'right' ||
      column.format === 'amount' ||
      column.format === 'debit' ||
      column.format === 'credit' ||
      column.format === 'balance'
    ) {
      parts.push('is-amount');
    }
    if (column.format === 'debit') {
      parts.push('col-debit', 'is-debit');
    }
    if (column.format === 'credit') {
      parts.push('col-credit', 'is-credit');
    }
    if (column.format === 'balance') {
      parts.push('col-balance', 'is-balance');
    }
    if (column.cellClass) {
      parts.push(column.cellClass);
    }
    return parts.join(' ');
  }

  formatMoneyCell(row: Row, column: UsgDataTableColumn): string {
    const raw = row[column.key];
    if (raw === null || raw === undefined || raw === '') {
      return '—';
    }
    if (typeof raw === 'number') {
      return raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(raw);
  }

  isEmptyAmount(row: Row, column: UsgDataTableColumn): boolean {
    if (column.format !== 'debit' && column.format !== 'credit') {
      return false;
    }
    const raw = row[column.key];
    return raw === null || raw === undefined || raw === '';
  }

  toggleSort(column: UsgDataTableColumn): void {
    if (!column.sortable) {
      return;
    }
    if (this.sortedKey() === column.key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
      return;
    }
    this.sortedKey.set(column.key);
    this.sortDir.set('asc');
  }

  onFooterPageSizeChange(next: number): void {
    if (!Number.isFinite(next) || next <= 0) {
      return;
    }
    this.pageSize.set(next);
    this.currentPage.set(1);
    this.pageSizeChange.emit(next);
    this.pageChange.emit(1);
  }

  goToPage(next: number): void {
    if (next < 1 || next > this.pageCount()) {
      return;
    }
    this.currentPage.set(next);
    this.pageChange.emit(next);
  }

  onRowClick(row: Row): void {
    this.rowClick.emit(row);
  }

  onAction(variant: UsgDataTableAction['variant'], row: Row): void {
    this.action.emit({ variant, row });
  }

  isActionDisabled(action: UsgDataTableAction, row: Row): boolean {
    return action.disabled?.(row) ?? false;
  }
}
