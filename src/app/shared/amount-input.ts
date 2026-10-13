/** Parse user-entered amount text (commas allowed) to a number. */
export function parseAmountInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/,/g, '');
  if (!/^\d*(\.\d*)?$/.test(normalized) || normalized === '.' || normalized === '') {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Display amount in inputs with grouping and two decimal places. */
export function formatAmountInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const parsed = parseAmountInput(trimmed);
    if (parsed === null) {
      return trimmed;
    }
    value = parsed;
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Restrict typing to digits, commas, and a single decimal separator. */
export function restrictAmountTyping(value: string): string {
  let next = value.replace(/[^\d.,]/g, '');
  const firstSep = next.search(/[.,]/);
  if (firstSep >= 0) {
    const head = next.slice(0, firstSep + 1);
    const tail = next.slice(firstSep + 1).replace(/[.,]/g, '');
    next = head + tail;
  }
  return next;
}

/** Normalize field value on blur to formatted amount text. */
export function formatAmountOnBlur(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = parseAmountInput(trimmed);
  if (parsed === null) {
    return trimmed;
  }

  return formatAmountInput(parsed);
}
