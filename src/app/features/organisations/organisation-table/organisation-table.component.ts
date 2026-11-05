import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import {
  ColumnFilters,
  Organisation,
  OrganisationFilters,
  SortKey,
  SortState,
} from '../../../core/models/organisation.model';
import { OrganisationColumnFiltersComponent } from '../organisation-column-filters/organisation-column-filters.component';
import { OrganisationAvatarComponent } from '../organisation-avatar/organisation-avatar.component';
import { OrganisationStatusComponent } from '../organisation-status/organisation-status.component';

@Component({
  selector: 'app-organisation-table',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    OrganisationAvatarComponent,
    OrganisationColumnFiltersComponent,
    OrganisationStatusComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organisation-table.component.html',
  styleUrl: './organisation-table.component.scss',
})
export class OrganisationTableComponent {
  readonly organisations = input.required<Organisation[]>();
  readonly sort = input.required<SortState>();
  readonly filters = input.required<OrganisationFilters>();
  readonly filtersChange = output<ColumnFilters>();
  readonly sortChange = output<SortKey>();
  readonly select = output<Organisation>();

  protected readonly columns: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: 'name', label: 'table.name' },
    { key: 'status', label: 'table.status' },
    { key: 'memberCount', label: 'table.members', numeric: true },
    { key: 'ownerEmail', label: 'table.owner' },
    { key: 'createdAt', label: 'table.created' },
  ];

  protected ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    const { key: activeKey, direction } = this.sort();
    if (activeKey !== key) {
      return 'none';
    }
    return direction === 'asc' ? 'ascending' : 'descending';
  }
}
