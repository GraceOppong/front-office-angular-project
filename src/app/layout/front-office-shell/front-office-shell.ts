import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ActivityStore } from '../../shared/activity.store';
import { AppTopbar } from '../app-topbar/app-topbar';

@Component({
  selector: 'app-front-office-shell',
  imports: [RouterOutlet, AppTopbar],
  templateUrl: './front-office-shell.html',
  styleUrl: './front-office-shell.css',
})
export class FrontOfficeShell {
  private readonly router = inject(Router);
  readonly activityStore = inject(ActivityStore);
  readonly navOpen = signal(false);

  constructor() {
    this.syncActivityFromUrl(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.closeNav();
        this.syncActivityFromUrl(event.urlAfterRedirects);
      });
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeNav();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth > 960) {
      this.closeNav();
    }
  }

  onActivitySearch(value: string): void {
    this.activityStore.setQuery(value);
  }

  selectActivity(code: string): void {
    this.activityStore.select(code);
    this.closeNav();

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

    if (
      url.includes('/teller-activities') ||
      url.includes('/teller-callover') ||
      url.includes('/same-day-reversal')
    ) {
      this.activityStore.select('TTTI');
    }
  }
}
