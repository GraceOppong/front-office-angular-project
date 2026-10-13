import { Injectable, signal } from '@angular/core';
import { formatBusinessDate } from './business-date';

@Injectable({ providedIn: 'root' })
export class TellerSessionStore {
  readonly displayName = signal('Amara Mensah');
  readonly branch = signal('Accra Main Branch');
  /** System calendar date (updates when the store is created). */
  readonly currentDate = signal(formatBusinessDate(new Date()));
  /** Active banking business date for the branch. */
  readonly businessDate = signal(formatBusinessDate(new Date()));
}
