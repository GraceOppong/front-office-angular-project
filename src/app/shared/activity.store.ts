import { Injectable, computed, signal } from '@angular/core';

export interface ActivityItem {
  code: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class ActivityStore {
  readonly query = signal('');
  readonly selectedCode = signal('TTTI');

  readonly activities: ActivityItem[] = [
    { code: 'TTTI', label: 'Teller Activities' },
    { code: 'VVLT', label: 'Vault' },
  ];

  readonly filteredActivities = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.activities;
    }
    return this.activities.filter(
      (item) => item.code.toLowerCase().includes(q) || item.label.toLowerCase().includes(q),
    );
  });

  readonly selectedActivity = computed(() =>
    this.activities.find((item) => item.code === this.selectedCode()) ?? null,
  );

  setQuery(value: string): void {
    this.query.set(value);
  }

  select(code: string): void {
    this.selectedCode.set(code);
  }
}
