import { Component, computed, input, output } from '@angular/core';
import { isoFromDmy, maskDmyInput, toDisplayDmy, toIsoDateInputValue } from '../business-date';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.html',
  styleUrl: './date-input.css',
})
export class DateInput {
  readonly inputId = input.required<string>();
  readonly value = input('');
  readonly maxToday = input(false);
  readonly compact = input(false);
  readonly ariaLabel = input('');

  readonly valueChange = output<string>();
  readonly blurred = output<void>();

  readonly pickerId = computed(() => `${this.inputId()}-picker`);
  readonly isoValue = computed(() => isoFromDmy(this.value()));
  readonly maxIso = computed(() => (this.maxToday() ? toIsoDateInputValue() : ''));

  onTextInput(value: string): void {
    this.valueChange.emit(maskDmyInput(value));
  }

  onTextBlur(): void {
    this.blurred.emit();
  }

  onPickerChange(value: string): void {
    this.valueChange.emit(value ? toDisplayDmy(value) : '');
    this.blurred.emit();
  }

  openPicker(picker: HTMLInputElement): void {
    try {
      picker.showPicker();
    } catch {
      picker.focus();
      picker.click();
    }
  }
}
