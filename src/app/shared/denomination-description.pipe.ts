import { inject, Pipe, PipeTransform } from '@angular/core';
import { denominationDescriptionFor } from './currency-denominations';
import { WorkspaceCurrencyStore } from './workspace-currency.store';

@Pipe({
  name: 'denomDescription',
  standalone: true,
  pure: false,
})
export class DenominationDescriptionPipe implements PipeTransform {
  private readonly currencyStore = inject(WorkspaceCurrencyStore);

  transform(value: string, currencyOverride?: string | null): string {
    const currency = currencyOverride ?? this.currencyStore.selectedCurrency();
    return denominationDescriptionFor(value, currency);
  }
}
