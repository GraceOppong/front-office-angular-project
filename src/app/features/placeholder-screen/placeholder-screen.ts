import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-placeholder-screen',
  templateUrl: './placeholder-screen.html',
  styleUrl: './placeholder-screen.css',
})
export class PlaceholderScreen {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(this.route.data.pipe(map((d) => (d['title'] as string) || 'Screen')), {
    initialValue: 'Screen',
  });

  readonly description = toSignal(
    this.route.data.pipe(map((d) => (d['description'] as string) || '')),
    { initialValue: '' },
  );
}
