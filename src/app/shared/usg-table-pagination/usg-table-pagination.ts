import { Component, computed, input, output } from '@angular/core';
import {
  USG_DEFAULT_PAGE_SIZE_OPTIONS,
  usgPageCount,
  usgPageNumbers,
  usgRangeEnd,
  usgRangeStart,
} from './usg-pagination.util';

@Component({
  selector: 'app-usg-table-pagination',
  templateUrl: './usg-table-pagination.html',
  host: { class: 'usg-table-pagination-host' },
})
export class UsgTablePagination {
  readonly totalRecords = input.required<number>();
  readonly page = input(1);
  readonly pageSize = input(5);
  readonly pageSizeOptions = input<number[]>([...USG_DEFAULT_PAGE_SIZE_OPTIONS]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly pageCount = computed(() => usgPageCount(this.totalRecords(), this.pageSize()));

  readonly rangeStart = computed(() => usgRangeStart(this.totalRecords(), this.page(), this.pageSize()));

  readonly rangeEnd = computed(() => usgRangeEnd(this.totalRecords(), this.page(), this.pageSize()));

  readonly pageNumbers = computed(() => usgPageNumbers(this.page(), this.pageCount()));

  goToPage(next: number): void {
    if (next < 1 || next > this.pageCount()) {
      return;
    }
    this.pageChange.emit(next);
  }

  onPageSizeChange(raw: string): void {
    const next = Number(raw);
    if (!Number.isFinite(next) || next <= 0) {
      return;
    }
    this.pageSizeChange.emit(next);
    this.pageChange.emit(1);
  }
}
