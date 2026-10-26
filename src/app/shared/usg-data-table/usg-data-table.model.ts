export type UsgDataTableAlign = 'left' | 'center' | 'right';

export type UsgDataTableColumn<T extends Record<string, unknown> = Record<string, unknown>> = {
  key: string;
  header: string;
  sortable?: boolean;
  align?: UsgDataTableAlign;
  cellClass?: string;
  /** Right-align amounts with tabular nums */
  format?: 'text' | 'amount' | 'status' | 'debit' | 'credit' | 'balance';
};

export type UsgDataTableActionVariant = 'view' | 'edit' | 'delete';

export type UsgDataTableAction<T extends Record<string, unknown> = Record<string, unknown>> = {
  variant: UsgDataTableActionVariant;
  label: string;
  disabled?: (row: T) => boolean;
};

export type UsgDataTableActionEvent<T extends Record<string, unknown> = Record<string, unknown>> = {
  variant: UsgDataTableActionVariant;
  row: T;
};
