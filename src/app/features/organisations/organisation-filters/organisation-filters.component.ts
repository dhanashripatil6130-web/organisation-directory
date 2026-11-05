import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-organisation-filters',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organisation-filters.component.html',
  styleUrl: './organisation-filters.component.scss',
})
export class OrganisationFiltersComponent {
  readonly search = input('');
  readonly active = input(false);
  readonly searchChange = output<string>();
  readonly cleared = output<void>();

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  private lastEmitted = '';

  constructor() {
    effect(() => {
      const value = this.search();
      if (value !== this.lastEmitted) {
        this.lastEmitted = value;
        this.searchControl.setValue(value, { emitEvent: false });
      }
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.lastEmitted = value;
        this.searchChange.emit(value);
      });
  }
}
