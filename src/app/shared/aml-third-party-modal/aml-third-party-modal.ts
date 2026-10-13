import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, OnDestroy, input, output, signal } from '@angular/core';
import {
  AmlThirdPartyDetails,
  cloneAmlThirdParty,
  createEmptyAmlThirdParty,
} from '../aml-third-party.model';

@Component({
  selector: 'app-aml-third-party-modal',
  imports: [],
  templateUrl: './aml-third-party-modal.html',
  styleUrl: './aml-third-party-modal.css',
})
export class AmlThirdPartyModal implements OnDestroy {
  private readonly document = inject(DOCUMENT);

  readonly initialValue = input<AmlThirdPartyDetails | null>(null);

  readonly saved = output<AmlThirdPartyDetails>();
  readonly cancelled = output<void>();

  readonly formError = signal('');

  readonly titleOptions = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Other'];
  readonly genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  readonly idTypeOptions = ['National ID', 'Passport', 'Drivers Licence', 'Voters ID', 'Other'];
  readonly employmentStatusOptions = ['Employed', 'Self-employed', 'Unemployed', 'Retired', 'Student'];

  readonly draft = signal<AmlThirdPartyDetails>(createEmptyAmlThirdParty());

  constructor() {
    this.document.body.style.overflow = 'hidden';

    effect(() => {
      const seed = this.initialValue();
      this.draft.set(cloneAmlThirdParty(seed ?? createEmptyAmlThirdParty()));
    });
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  patchField<K extends keyof AmlThirdPartyDetails>(key: K, value: AmlThirdPartyDetails[K]): void {
    this.draft.update((current) => ({ ...current, [key]: value }));
    this.formError.set('');
  }

  onNationalityInput(index: number, value: string): void {
    this.draft.update((current) => {
      const nationalities = [...current.nationalities];
      nationalities[index] = value;
      return { ...current, nationalities };
    });
    this.formError.set('');
  }

  addNationality(): void {
    this.draft.update((current) => ({
      ...current,
      nationalities: [...current.nationalities, ''],
    }));
  }

  removeNationality(index: number): void {
    this.draft.update((current) => {
      if (current.nationalities.length <= 1) {
        return { ...current, nationalities: [''] };
      }
      const nationalities = current.nationalities.filter((_, i) => i !== index);
      return { ...current, nationalities };
    });
  }

  onSave(): void {
    const data = this.draft();
    if (!data.firstName.trim()) {
      this.formError.set('First name is required.');
      return;
    }
    if (!data.surname.trim()) {
      this.formError.set('Surname is required.');
      return;
    }
    if (!data.idNumber.trim()) {
      this.formError.set('ID number is required.');
      return;
    }

    this.saved.emit(cloneAmlThirdParty(data));
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(): void {
    this.onCancel();
  }

  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
