import { Component, computed, input, output, signal } from '@angular/core';
import { isoFromDmy, maskDmyInput, toDisplayDmy, toIsoDateInputValue } from '../business-date';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.html',
  styleUrl: './date-input.css',
  host: {
    '[class.has-value]': 'value().trim().length > 0',
  },
})
export class DateInput {
  readonly inputId = input.required<string>();
  readonly value = input('');
  readonly maxToday = input(false);
  readonly compact = input(false);
  readonly ariaLabel = input('');
  readonly placeholder = input('dd-mmm-yyyy');
  readonly placeholderOnFocusOnly = input(false);

  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  private readonly focused = signal(false);

  readonly pickerId = computed(() => `${this.inputId()}-picker`);
  readonly isoValue = computed(() => isoFromDmy(this.value()));
  readonly maxIso = computed(() => (this.maxToday() ? toIsoDateInputValue() : ''));
  readonly resolvedPlaceholder = computed(() =>
    this.placeholderOnFocusOnly() ? (this.focused() ? this.placeholder() : '') : this.placeholder(),
  );

  onTextInput(value: string): void {
    this.valueChange.emit(maskDmyInput(value));
  }

  onTextFocus(): void {
    this.focused.set(true);
  }

  onTextBlur(): void {
    this.focused.set(false);
    this.blurred.emit();
  }

  onPickerInput(iso: string, picker: HTMLInputElement): void {
    if (!iso) {
      return;
    }
    this.applyPickerValue(iso, picker);
  }

  onPickerChange(iso: string, picker: HTMLInputElement): void {
    this.applyPickerValue(iso, picker);
  }

  private applyPickerValue(iso: string, picker: HTMLInputElement): void {
    this.valueChange.emit(iso ? toDisplayDmy(iso) : '');
    this.blurred.emit();
    this.closePicker(picker);
  }

  /** Dismiss native date UI and return focus to the text field. */
  private closePicker(picker: HTMLInputElement): void {
    picker.blur();
    queueMicrotask(() => {
      const text = document.getElementById(this.inputId()) as HTMLInputElement | null;
      text?.blur();
    });
  }
}
