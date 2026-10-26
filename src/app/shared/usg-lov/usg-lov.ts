import { Component, ElementRef, HostListener, input, output, signal } from '@angular/core';
import { UsgLovOption } from './usg-lov.model';

@Component({
  selector: 'app-usg-lov',
  templateUrl: './usg-lov.html',
  styleUrl: './usg-lov.css',
})
export class UsgLov {
  readonly inputId = input.required<string>();
  readonly options = input.required<UsgLovOption[]>();
  readonly value = input<UsgLovOption | null>(null);
  readonly disabled = input(false);
  readonly placeholder = input('Search…');

  readonly valueChange = output<UsgLovOption | null>();

  readonly open = signal(false);
  readonly query = signal('');

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  displayLabel(): string {
    return this.value()?.label ?? '';
  }

  filteredOptions(): UsgLovOption[] {
    const q = this.query().trim().toLowerCase();
    const list = this.options();
    if (!q) {
      return list;
    }
    return list.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.query.set('');
    }
  }

  select(option: UsgLovOption): void {
    this.valueChange.emit(option);
    this.open.set(false);
    this.query.set('');
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.valueChange.emit(null);
    this.query.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
