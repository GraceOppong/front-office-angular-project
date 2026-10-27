export type HomePageLayout = 'sidebar' | 'action-bar' | 'action-grid';

/** Active home layout — Design 2 only (Design 1 & 3 commented out below). */
export const HOME_PAGE_LAYOUTS: HomePageLayout[] = ['action-bar'];
// export const HOME_PAGE_LAYOUTS: HomePageLayout[] = ['sidebar', 'action-bar', 'action-grid'];

export const HOME_PAGE_LAYOUT_LABELS: Record<HomePageLayout, string> = {
  sidebar: 'Design 1 — Main', // disabled
  'action-bar': 'Design 2 — Internal bar',
  'action-grid': 'Design 3 — Center till', // disabled
};

const STORAGE_KEY = 'front-office.homePageLayout';

export function readHomePageLayout(): HomePageLayout {
  if (typeof sessionStorage === 'undefined') {
    return 'action-bar';
  }
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    if (HOME_PAGE_LAYOUTS.includes(stored as HomePageLayout)) {
      return stored as HomePageLayout;
    }
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return 'action-bar';
}

export function saveHomePageLayout(layout: HomePageLayout): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, layout);
}
