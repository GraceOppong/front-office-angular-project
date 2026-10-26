import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { USG_FIELD_TYPE_CONFIG, UsgFieldType } from './usg-field-types';

/**
 * Applies UnionSG fieldType width, alignment, maxlength, and inputmode to a native control.
 * Use with class="field" (added automatically).
 *
 * @example
 * <input usgFieldType="accountNumber" ... />
 */
@Directive({
  selector: 'input[usgFieldType], select[usgFieldType], textarea[usgFieldType]',
  host: { class: 'field' },
})
export class UsgFieldTypeDirective {
  private readonly el = inject(ElementRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>);
  private readonly renderer = inject(Renderer2);

  readonly usgFieldType = input.required<UsgFieldType>({ alias: 'usgFieldType' });

  private appliedTypeClass: string | null = null;

  constructor() {
    effect(() => {
      const type = this.usgFieldType();
      const config = USG_FIELD_TYPE_CONFIG[type];
      const host = this.el.nativeElement;

      if (this.appliedTypeClass) {
        this.renderer.removeClass(host, this.appliedTypeClass);
      }
      this.appliedTypeClass = config.cssClass;
      this.renderer.addClass(host, config.cssClass);

      host.style.textAlign = config.textAlign;

      if (config.maxLength !== null && 'maxLength' in host) {
        host.maxLength = config.maxLength;
      } else if ('maxLength' in host) {
        host.removeAttribute('maxlength');
      }

      if ('inputMode' in host) {
        host.inputMode = config.inputMode;
      }
    });
  }
}
