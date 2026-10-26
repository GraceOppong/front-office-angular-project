/** UnionSG @unionsg/ui fieldType presets — https://unionsg-ui.vercel.app/ */
export type UsgFieldType =
  | 'name'
  | 'accountNumber'
  | 'customerNumber'
  | 'amount'
  | 'date'
  | 'email'
  | 'short'
  | 'lov';

export type UsgFieldTypeConfig = {
  cssClass: string;
  maxLength: number | null;
  inputMode: 'text' | 'numeric' | 'decimal' | 'email' | 'tel';
  textAlign: 'left' | 'center' | 'right';
};

export const USG_ACCOUNT_NUMBER_MAX_LENGTH = 18;
export const USG_CUSTOMER_NUMBER_MAX_LENGTH = 5;
export const USG_DATE_MAX_LENGTH = 11;

export const USG_FIELD_TYPE_CONFIG: Record<UsgFieldType, UsgFieldTypeConfig> = {
  name: {
    cssClass: 'field-type-name',
    maxLength: null,
    inputMode: 'text',
    textAlign: 'left',
  },
  accountNumber: {
    cssClass: 'field-type-account-number',
    maxLength: USG_ACCOUNT_NUMBER_MAX_LENGTH,
    inputMode: 'numeric',
    textAlign: 'left',
  },
  customerNumber: {
    cssClass: 'field-type-customer-number',
    maxLength: USG_CUSTOMER_NUMBER_MAX_LENGTH,
    inputMode: 'numeric',
    textAlign: 'left',
  },
  amount: {
    cssClass: 'field-type-amount',
    maxLength: null,
    inputMode: 'decimal',
    textAlign: 'right',
  },
  date: {
    cssClass: 'field-type-date',
    maxLength: USG_DATE_MAX_LENGTH,
    inputMode: 'text',
    textAlign: 'center',
  },
  email: {
    cssClass: 'field-type-email',
    maxLength: null,
    inputMode: 'email',
    textAlign: 'left',
  },
  short: {
    cssClass: 'field-type-phone',
    maxLength: null,
    inputMode: 'tel',
    textAlign: 'left',
  },
  lov: {
    cssClass: 'field-type-lov',
    maxLength: null,
    inputMode: 'text',
    textAlign: 'left',
  },
};

/** CSS classes for a native input/select (includes base `.field`). */
export function usgFieldClasses(
  fieldType: UsgFieldType,
  extra: string | string[] = '',
): string {
  const config = USG_FIELD_TYPE_CONFIG[fieldType];
  const extras = Array.isArray(extra) ? extra : extra ? [extra] : [];
  return ['field', config.cssClass, ...extras].filter(Boolean).join(' ');
}
