import { Component, computed, input, output } from '@angular/core';

export type MessagePopupVariant = 'info' | 'warn' | 'success';

function inferVariant(message: string): MessagePopupVariant {
  if (
    /required|Enter a valid|Select |not found|Tick at least|Unable to|does not have|must match|greater than zero|Only \d+ available|Enter denominations|Enter an amount|Tap to select/i.test(
      message,
    )
  ) {
    return 'warn';
  }
  if (
    /submitted|posted|Downloaded|sent to vault|accepted|rejected|deleted|cleared|listed in Teller|moved to|issued|returned to the teller|Callover submitted|transactions as/i.test(
      message,
    )
  ) {
    return 'success';
  }
  return 'info';
}

function titleForVariant(variant: MessagePopupVariant, customTitle: string): string {
  if (customTitle !== 'Notice') {
    return customTitle;
  }
  switch (variant) {
    case 'success':
      return 'Success';
    case 'warn':
      return 'Please check';
    default:
      return 'Notice';
  }
}

@Component({
  selector: 'app-message-popup',
  imports: [],
  templateUrl: './message-popup.html',
  styleUrl: './message-popup.css',
})
export class MessagePopup {
  readonly message = input('');
  readonly title = input('Notice');
  /** When omitted, variant is inferred from the message text. */
  readonly variant = input<MessagePopupVariant | undefined>(undefined);
  readonly closed = output<void>();

  readonly resolvedVariant = computed((): MessagePopupVariant => {
    const explicit = this.variant();
    if (explicit) {
      return explicit;
    }
    const text = this.message().trim();
    return text ? inferVariant(text) : 'info';
  });

  readonly resolvedTitle = computed(() =>
    titleForVariant(this.resolvedVariant(), this.title()),
  );

  dismiss(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.dismiss();
  }
}
