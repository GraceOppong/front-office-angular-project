export type HomePageLayout = 'sidebar' | 'action-bar' | 'action-grid';

export const HOME_PAGE_LAYOUTS: HomePageLayout[] = ['sidebar', 'action-bar', 'action-grid'];

export const HOME_PAGE_LAYOUT_LABELS: Record<HomePageLayout, string> = {
  sidebar: 'Design 1 — Main',
  'action-bar': 'Design 2 — Internal bar',
  'action-grid': 'Design 3 — Center till',
};

const STORAGE_KEY = 'front-office.homePageLayout';

export function readHomePageLayout(): HomePageLayout {
  if (typeof sessionStorage === 'undefined') {
    return 'sidebar';
  }
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    if (HOME_PAGE_LAYOUTS.includes(stored as HomePageLayout)) {
      return stored as HomePageLayout;
    }
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return 'sidebar';
}

export function saveHomePageLayout(layout: HomePageLayout): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, layout);
}
