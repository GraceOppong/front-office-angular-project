import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ActivityStore } from '../../shared/activity.store';

@Component({
  selector: 'app-front-office-shell',
  imports: [RouterOutlet],
  templateUrl: './front-office-shell.html',
  styleUrl: './front-office-shell.css',
})
export class FrontOfficeShell {
  private readonly router = inject(Router);
  readonly activityStore = inject(ActivityStore);

  constructor() {
    this.syncActivityFromUrl(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.syncActivityFromUrl(event.urlAfterRedirects));
  }

  onActivitySearch(value: string): void {
    this.activityStore.setQuery(value);
  }

  selectActivity(code: string): void {
    this.activityStore.select(code);

    if (code === 'VVLT') {
      void this.router.navigateByUrl('/vault');
      return;
    }

    void this.router.navigateByUrl('/teller-activities');
  }

  private syncActivityFromUrl(url: string): void {
    if (url.includes('/vault')) {
      this.activityStore.select('VVLT');
      return;
    }

    if (url.includes('/teller-activities') || url.includes('/teller-callover')) {
      this.activityStore.select('TTTI');
    }
  }
}
