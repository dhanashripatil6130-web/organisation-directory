import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ALL_STATUSES, ColumnFilters, OrganisationFilters, StatusFilter } from '../../../core/models/organisation.model';

const FILTER_DEBOUNCE_MS = 300;

@Component({
  selector: 'tr[app-column-filters]',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organisation-column-filters.component.html',
  styleUrl: './organisation-column-filters.component.scss',
})
export class OrganisationColumnFiltersComponent {
  readonly filters = input.required<OrganisationFilters>();
  readonly filtersChange = output<ColumnFilters>();

  protected readonly statuses = ALL_STATUSES;
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: '',
    status: '' as StatusFilter,
    owner: '',
    minMembers: '',
    created: '',
  });
  private lastEmitted = '';

  constructor() {
    effect(() => {
      const { name, status, owner, minMembers, created } = this.filters();
      const incoming: ColumnFilters = { name, status, owner, minMembers, created };
      const serialised = JSON.stringify(incoming);

      if (serialised !== this.lastEmitted) {
        this.lastEmitted = serialised;
        this.form.setValue(incoming, { emitEvent: false });
      }
    });

    this.form.valueChanges.pipe(debounceTime(FILTER_DEBOUNCE_MS), takeUntilDestroyed()).subscribe(() => {
      const value = this.form.getRawValue();
      this.lastEmitted = JSON.stringify(value);
      this.filtersChange.emit(value);
    });
  }
}
