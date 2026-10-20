import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, input, output, signal } from '@angular/core';
import {
  AmlThirdPartyDetails,
  cloneAmlThirdParty,
  createEmptyAmlThirdParty,
} from '../aml-third-party.model';
import { maskDmyInput, normalizeDmyDateInput, toDisplayDmy } from '../business-date';
import { DateInput } from '../date-input/date-input';
import { FieldLabel } from '../field-label/field-label';

type AmlDateKey = 'dateOfBirth' | 'idIssueDate' | 'idExpiryDate';

export const AML_STEPS = [
  { id: 'personal', label: 'Personal' },
  { id: 'other', label: 'Contact' },
  { id: 'id', label: 'ID' },
  { id: 'employer', label: 'Employer' },
] as const;

export type AmlStepId = (typeof AML_STEPS)[number]['id'];

@Component({
  selector: 'app-aml-third-party-modal',
  imports: [FieldLabel, DateInput],
  templateUrl: './aml-third-party-modal.html',
  styleUrl: './aml-third-party-modal.css',
})
export class AmlThirdPartyModal implements OnDestroy {
  private readonly document = inject(DOCUMENT);

  readonly initialValue = input<AmlThirdPartyDetails | null>(null);

  readonly saved = output<AmlThirdPartyDetails>();
  readonly cancelled = output<void>();

  readonly formError = signal('');
  readonly stepIndex = signal(0);
  readonly maxReached = signal(0);
  readonly steps = AML_STEPS;
  readonly isFirstStep = computed(() => this.stepIndex() === 0);
  readonly isLastStep = computed(() => this.stepIndex() === this.steps.length - 1);
  readonly currentStep = computed(() => this.steps[this.stepIndex()]);

  readonly titleOptions = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Other'];
  readonly genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  readonly idTypeOptions = ['National ID', 'Passport', 'Drivers Licence', 'Voters ID', 'Other'];
  readonly employmentStatusOptions = ['Employed', 'Self-employed', 'Unemployed', 'Retired', 'Student'];

  readonly draft = signal<AmlThirdPartyDetails>(createEmptyAmlThirdParty());

  constructor() {
    this.document.body.style.overflow = 'hidden';

    effect(() => {
      const seed = cloneAmlThirdParty(this.initialValue() ?? createEmptyAmlThirdParty());
      this.draft.set({
        ...seed,
        dateOfBirth: toDisplayDmy(seed.dateOfBirth),
        idIssueDate: toDisplayDmy(seed.idIssueDate),
        idExpiryDate: toDisplayDmy(seed.idExpiryDate),
      });
      this.stepIndex.set(0);
      this.maxReached.set(0);
      this.formError.set('');
    });
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  patchField<K extends keyof AmlThirdPartyDetails>(key: K, value: AmlThirdPartyDetails[K]): void {
    this.draft.update((current) => ({ ...current, [key]: value }));
    this.formError.set('');
  }

  onDateInput(key: AmlDateKey, value: string): void {
    this.patchField(key, maskDmyInput(value));
  }

  onDateBlur(key: AmlDateKey): void {
    this.patchField(key, normalizeDmyDateInput(this.draft()[key]));
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

  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length || index > this.maxReached()) {
      return;
    }
    this.formError.set('');
    this.stepIndex.set(index);
  }

  goPrevious(): void {
    if (this.isFirstStep()) {
      return;
    }
    this.formError.set('');
    this.stepIndex.update((index) => index - 1);
  }

  goNext(): void {
    if (this.isLastStep() || !this.validateCurrentStep()) {
      return;
    }
    const next = this.stepIndex() + 1;
    this.stepIndex.set(next);
    if (next > this.maxReached()) {
      this.maxReached.set(next);
    }
  }

  onSave(): void {
    if (!this.validateRequiredFields()) {
      return;
    }
    this.saved.emit(cloneAmlThirdParty(this.draft()));
  }

  private validateCurrentStep(): boolean {
    const step = this.currentStep().id;
    const data = this.draft();
    if (step === 'personal') {
      return this.requireName(data);
    }
    if (step === 'id') {
      return this.requireIdNumber(data);
    }
    this.formError.set('');
    return true;
  }

  private validateRequiredFields(): boolean {
    const data = this.draft();
    if (!this.requireName(data)) {
      this.stepIndex.set(0);
      return false;
    }
    if (!this.requireIdNumber(data)) {
      this.stepIndex.set(2);
      return false;
    }
    this.formError.set('');
    return true;
  }

  private requireName(data: AmlThirdPartyDetails): boolean {
    if (!data.firstName.trim()) {
      this.formError.set('First name is required.');
      return false;
    }
    if (!data.surname.trim()) {
      this.formError.set('Surname is required.');
      return false;
    }
    return true;
  }

  private requireIdNumber(data: AmlThirdPartyDetails): boolean {
    if (!data.idNumber.trim()) {
      this.formError.set('ID number is required.');
      return false;
    }
    return true;
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
