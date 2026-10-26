import { Component, effect, forwardRef, input, OnInit, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type UsgPhoneCountry = {
  code: string;
  name: string;
  dial: string;
  flag: string;
};

const DEFAULT_COUNTRIES: UsgPhoneCountry[] = [
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
];

@Component({
  selector: 'app-usg-phone-input',
  templateUrl: './usg-phone-input.html',
  styleUrl: './usg-phone-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UsgPhoneInput),
      multi: true,
    },
  ],
})
export class UsgPhoneInput implements ControlValueAccessor, OnInit {
  readonly inputId = input.required<string>();
  readonly disabled = input(false);
  readonly defaultCountry = input('GH');
  readonly countries = input<UsgPhoneCountry[]>(DEFAULT_COUNTRIES);
  /** Parent-bound E.164-style value (works without reactive forms). */
  readonly boundValue = input('', { alias: 'value' });

  readonly valueChange = output<{ fullNumber: string; country: UsgPhoneCountry; localNumber: string }>();

  readonly country = signal<UsgPhoneCountry>(DEFAULT_COUNTRIES[0]);
  localNumber = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private _disabled = false;

  ngOnInit(): void {
    const list = this.countries();
    const match = list.find((c) => c.code === this.defaultCountry()) ?? list[0];
    if (match) {
      this.country.set(match);
    }
    this.applyExternalValue(this.boundValue());
  }

  constructor() {
    effect(() => {
      this.applyExternalValue(this.boundValue());
    });
  }

  writeValue(value: string | null): void {
    this.applyExternalValue(value ?? '');
  }

  private applyExternalValue(value: string): void {
    if (!value) {
      this.localNumber = '';
      return;
    }
    const list = this.countries();
    const byDial = [...list].sort((a, b) => b.dial.length - a.dial.length).find((c) => value.startsWith(c.dial));
    if (byDial) {
      this.country.set(byDial);
      this.localNumber = value.slice(byDial.dial.length).trim();
      return;
    }
    const dial = this.country().dial;
    this.localNumber = value.startsWith(dial) ? value.slice(dial.length).trim() : value;
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

  isDisabled(): boolean {
    return this.disabled() || this._disabled;
  }

  onCountryChange(code: string): void {
    const next = this.countries().find((c) => c.code === code);
    if (next) {
      this.country.set(next);
      this.emitValue();
    }
  }

  onLocalInput(raw: string): void {
    this.localNumber = raw.replace(/[^\d\s]/g, '');
    this.emitValue();
  }

  onBlur(): void {
    this.onTouched();
  }

  private emitValue(): void {
    const local = this.localNumber.replace(/\s/g, '');
    const full = local ? `${this.country().dial}${local}` : '';
    this.onChange(full);
    this.valueChange.emit({
      fullNumber: full,
      country: this.country(),
      localNumber: local,
    });
  }
}
