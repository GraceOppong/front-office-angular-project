import { Component, computed, inject, input, output, signal } from '@angular/core';
import { TellerSessionStore } from '../../shared/teller-session.store';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './app-topbar.html',
  styleUrl: './app-topbar.css',
})
export class AppTopbar {
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
  readonly session = inject(TellerSessionStore);
  readonly profileOpen = signal(false);

  readonly initials = computed(() => {
    const name = this.session.displayName().trim();
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  toggleProfile(): void {
    this.profileOpen.update((open) => !open);
  }

  closeProfile(): void {
    this.profileOpen.set(false);
  }
}
