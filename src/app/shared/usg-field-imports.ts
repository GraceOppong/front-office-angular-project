import { UsgEmailInput } from './usg-email-input/usg-email-input';
import { UsgFieldTypeDirective } from './usg-field-type.directive';
import { UsgLov } from './usg-lov/usg-lov';
import { UsgPhoneInput } from './usg-phone-input/usg-phone-input';
import { UsgDataTable } from './usg-data-table/usg-data-table';

/** Import on feature components that use UnionSG field presets. */
export const USG_FIELD_IMPORTS = [
  UsgFieldTypeDirective,
  UsgEmailInput,
  UsgPhoneInput,
  UsgLov,
  UsgDataTable,
] as const;
