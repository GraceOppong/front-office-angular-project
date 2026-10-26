import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { CashRequestStore } from '../../shared/cash-request.store';
import { MessagePopup } from '../../shared/message-popup/message-popup';
import {
  UsgDataTableAction,
  UsgDataTableActionEvent,
  UsgDataTableColumn,
} from '../../shared/usg-data-table/usg-data-table.model';
import { UsgDataTable } from '../../shared/usg-data-table/usg-data-table';

@Component({
  selector: 'app-ungranted-cash-request',
  imports: [DecimalPipe, MessagePopup, UsgDataTable],
  templateUrl: './ungranted-cash-request.html',
  styleUrl: './ungranted-cash-request.css',
})
export class UngrantedCashRequest {
  private readonly cashRequestStore = inject(CashRequestStore);

  readonly closed = output<void>();

  readonly requests = this.cashRequestStore.awaitingVaultRequests;
  readonly total = this.cashRequestStore.ungrantedTotal;
  readonly feedbackMessage = signal('');

  readonly tableRows = computed(() =>
    this.requests().map((row) => ({
      ...row,
      status: 'Ungranted',
    })),
  );

  readonly columns: UsgDataTableColumn[] = [
    { key: 'batchNo', header: 'Batch No', sortable: true },
    { key: 'transAmount', header: 'Trans Amount', sortable: true, format: 'amount', align: 'right' },
    { key: 'transTo', header: 'Trans To', sortable: true },
    { key: 'status', header: 'Status', format: 'status' },
  ];

  readonly tableActions: UsgDataTableAction[] = [
    { variant: 'view', label: 'View' },
    { variant: 'edit', label: 'Edit' },
    { variant: 'delete', label: 'Delete' },
  ];

  onTableAction(event: UsgDataTableActionEvent): void {
    if (event.variant === 'delete') {
      this.deleteRequest(String(event.row['id']));
      return;
    }
    if (event.variant === 'view') {
      this.feedbackMessage.set(`Batch ${event.row['batchNo']}: awaiting vault approval.`);
      return;
    }
    if (event.variant === 'edit') {
      this.feedbackMessage.set('Edit is not available until the request is granted.');
    }
  }

  deleteRequest(id: string): void {
    this.cashRequestStore.delete(id);
  }

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }
}
