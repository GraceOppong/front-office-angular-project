import { Component, effect, forwardRef, input, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-usg-email-input',
  templateUrl: './usg-email-input.html',
  styleUrl: './usg-email-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UsgEmailInput),
      multi: true,
    },
  ],
})
export class UsgEmailInput implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly disabled = input(false);
  readonly error = input<string | null>(null);
  /** Parent-bound value (works without reactive forms). */
  readonly boundValue = input('', { alias: 'value' });

  readonly blurred = output<void>();
  readonly validated = output<{ value: string; valid: boolean }>();
  readonly valueChange = output<string>();

  value = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      this.value = this.boundValue();
    });
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  private _disabled = false;

  isDisabled(): boolean {
    return this.disabled() || this._disabled;
  }

  onInput(raw: string): void {
    this.value = raw;
    this.onChange(raw);
    this.valueChange.emit(raw);
  }

  onBlur(): void {
    const trimmed = this.value.trim();
    const valid = !trimmed || EMAIL_PATTERN.test(trimmed);
    this.validated.emit({ value: trimmed, valid });
    this.onTouched();
    this.blurred.emit();
  }
}
