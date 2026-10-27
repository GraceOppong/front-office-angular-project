import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';

/** Measures floated label width and sets CSS vars so the shell top border gaps around the label. */
@Directive({
  selector: '.field-inset-shell',
})
export class FieldInsetNotchDirective implements AfterViewInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private resizeObserver?: ResizeObserver;
  private raf = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const shell = this.el.nativeElement;
    const sync = () => this.scheduleSync();

    shell.addEventListener('focusin', sync);
    shell.addEventListener('focusout', sync);
    shell.addEventListener('input', sync, true);
    shell.addEventListener('change', sync, true);

    const floater = shell.querySelector('app-field-label');
    floater?.addEventListener('transitionend', sync);

    this.resizeObserver = new ResizeObserver(sync);
    this.resizeObserver.observe(shell);
    const labelText = shell.querySelector('app-field-label .label-text');
    if (labelText) {
      this.resizeObserver.observe(labelText);
    }

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.raf);
      shell.removeEventListener('focusin', sync);
      shell.removeEventListener('focusout', sync);
      shell.removeEventListener('input', sync, true);
      shell.removeEventListener('change', sync, true);
      floater?.removeEventListener('transitionend', sync);
      this.resizeObserver?.disconnect();
    });

    sync();
  }

  private scheduleSync(): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => {
      this.syncNotch();
      window.setTimeout(() => this.syncNotch(), 150);
      window.setTimeout(() => this.syncNotch(), 300);
    });
  }

  private syncNotch(): void {
    const shell = this.el.nativeElement;

    if (!this.isLabelFloated(shell)) {
      shell.classList.remove('has-label-notch');
      shell.style.removeProperty('--notch-start');
      shell.style.removeProperty('--notch-end');
      return;
    }

    const labelText = shell.querySelector('app-field-label .label-text');
    if (!labelText) {
      return;
    }

    const pad = 5;
    const shellRect = shell.getBoundingClientRect();
    const labelRect = labelText.getBoundingClientRect();
    const start = Math.max(0, labelRect.left - shellRect.left - pad);
    const end = Math.min(shellRect.width, labelRect.right - shellRect.left + pad);

    shell.style.setProperty('--notch-start', `${start}px`);
    shell.style.setProperty('--notch-end', `${end}px`);
    shell.classList.add('has-label-notch');
  }

  private isLabelFloated(shell: HTMLElement): boolean {
    const formField = shell.closest('.form-field');
    const isDisplay = formField?.classList.contains('is-display');

    if (isDisplay) {
      const readonly = shell.querySelector<HTMLInputElement>('.field.field-readonly');
      if (!readonly) {
        return false;
      }
      if (readonly.classList.contains('is-loading')) {
        return true;
      }
      return readonly.value.trim().length > 0;
    }

    if (shell.matches(':focus-within')) {
      return true;
    }

    const input = shell.querySelector<HTMLInputElement>('.field:not(.field-readonly)');
    if (input) {
      if (input.classList.contains('is-loading')) {
        return true;
      }
      return !input.matches(':placeholder-shown');
    }

    const select = shell.querySelector<HTMLSelectElement>('.select-field');
    if (select) {
      return !select.classList.contains('is-placeholder');
    }

    return false;
  }
}
