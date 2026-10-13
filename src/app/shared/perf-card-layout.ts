export type PerfCardLayout = 'classic' | 'tinted' | 'elevated';

export const PERF_CARD_LAYOUTS: PerfCardLayout[] = ['classic', 'tinted', 'elevated'];

export const PERF_CARD_LAYOUT_LABELS: Record<PerfCardLayout, string> = {
  classic: 'Compact table',
  tinted: 'Dial & chips',
  elevated: 'Bento tiles',
};

const STORAGE_KEY = 'front-office.perfCardLayout';

export function readPerfCardLayout(): PerfCardLayout {
  if (typeof sessionStorage === 'undefined') {
    return 'classic';
  }
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored && PERF_CARD_LAYOUTS.includes(stored as PerfCardLayout)) {
    return stored as PerfCardLayout;
  }
  return 'classic';
}

export function savePerfCardLayout(layout: PerfCardLayout): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, layout);
}
