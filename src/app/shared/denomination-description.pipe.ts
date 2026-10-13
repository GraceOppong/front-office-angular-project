import { Pipe, PipeTransform } from '@angular/core';
import { denominationDescription } from './denomination-labels';

@Pipe({
  name: 'denomDescription',
  standalone: true,
})
export class DenominationDescriptionPipe implements PipeTransform {
  transform(value: string): string {
    return denominationDescription(value);
  }
}
