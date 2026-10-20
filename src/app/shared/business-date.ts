const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatBusinessDate(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS[date.getMonth()];
  return `${day}-${month}-${date.getFullYear()}`;
}

/** `YYYY-MM-DD` for native date inputs. */
export function toIsoDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDateInput(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function businessDateFromIsoDateInput(iso: string): string {
  const parsed = parseIsoDateInput(iso);
  return parsed ? formatBusinessDate(parsed) : formatBusinessDate();
}

export function toDmyDateInputValue(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function parseDmyDateInput(value: string): Date | null {
  const trimmed = value.trim();
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const digits = trimmed.replace(/\D/g, '');
  let day: number;
  let month: number;
  let year: number;
  if (slashMatch) {
    day = Number(slashMatch[1]);
    month = Number(slashMatch[2]);
    year = Number(slashMatch[3]);
  } else if (digits.length === 8) {
    day = Number(digits.slice(0, 2));
    month = Number(digits.slice(2, 4));
    year = Number(digits.slice(4, 8));
  } else {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function maskDmyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function normalizeDmyDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const parsed = parseDmyDateInput(trimmed);
  return parsed ? toDmyDateInputValue(parsed) : trimmed;
}

export function isoFromDmy(value: string): string {
  const parsed = parseDmyDateInput(value);
  return parsed ? toIsoDateInputValue(parsed) : '';
}

export function toDisplayDmy(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const dmy = parseDmyDateInput(trimmed);
  if (dmy) {
    return toDmyDateInputValue(dmy);
  }
  const iso = parseIsoDateInput(trimmed);
  return iso ? toDmyDateInputValue(iso) : trimmed;
}

export function businessDateFromDmyDateInput(dmy: string): string {
  const parsed = parseDmyDateInput(dmy);
  return parsed ? formatBusinessDate(parsed) : formatBusinessDate();
}

export function finalizeVoucherDateInput(value: string, today = new Date()): string {
  const trimmed = value.trim();
  const max = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!trimmed) {
    return '';
  }
  const parsed = parseDmyDateInput(trimmed);
  if (!parsed) {
    return trimmed;
  }
  const entered = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  if (entered.getTime() > max.getTime()) {
    return toDmyDateInputValue(max);
  }
  return toDmyDateInputValue(parsed);
}
