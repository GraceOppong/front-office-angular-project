const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Display / voucher format: `dd-Mmm-yyyy` (e.g. 26-Oct-2026). */
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

/** Canonical editable date string (`dd-Mmm-yyyy`). */
export function toDmyDateInputValue(date = new Date()): string {
  return formatBusinessDate(date);
}

function monthIndexFromToken(token: string): number | null {
  const idx = MONTHS.findIndex((m) => m.toLowerCase() === token.toLowerCase());
  return idx >= 0 ? idx : null;
}

function normalizeYear(raw: string): number | null {
  const year = Number(raw);
  if (!Number.isFinite(year)) {
    return null;
  }
  if (raw.length === 2) {
    return 2000 + year;
  }
  if (raw.length === 4) {
    return year;
  }
  return null;
}

export function parseDmyDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hyphenMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2}|\d{4})$/);
  if (hyphenMatch) {
    const day = Number(hyphenMatch[1]);
    const monthIdx = monthIndexFromToken(hyphenMatch[2]);
    const year = normalizeYear(hyphenMatch[3]);
    if (monthIdx === null || year === null) {
      return null;
    }
    const parsed = new Date(year, monthIdx, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== monthIdx ||
      parsed.getDate() !== day
    ) {
      return null;
    }
    return parsed;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
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

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 8) {
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));
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

  return null;
}

/** Mask typing toward `dd-Mmm-yyyy` (type 8 digits DDMMYYYY or paste formatted / legacy slash). */
export function maskDmyInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  if (/-[A-Za-z]{3}-/.test(trimmed)) {
    const parsed = parseDmyDateInput(trimmed);
    return parsed ? formatBusinessDate(parsed) : trimmed;
  }

  const slashParsed = parseDmyDateInput(trimmed);
  if (slashParsed && trimmed.includes('/')) {
    return formatBusinessDate(slashParsed);
  }

  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length === 8) {
    const parsed = parseDmyDateInput(digits);
    if (parsed) {
      return formatBusinessDate(parsed);
    }
  }

  return digits;
}

export function normalizeDmyDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const parsed = parseDmyDateInput(trimmed);
  return parsed ? formatBusinessDate(parsed) : trimmed;
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
  const parsed = parseDmyDateInput(trimmed);
  if (parsed) {
    return formatBusinessDate(parsed);
  }
  const iso = parseIsoDateInput(trimmed);
  return iso ? formatBusinessDate(iso) : trimmed;
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
    return formatBusinessDate(max);
  }
  return formatBusinessDate(parsed);
}
