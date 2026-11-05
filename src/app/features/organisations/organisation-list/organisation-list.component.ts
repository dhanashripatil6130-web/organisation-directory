import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import {
  ALL_STATUSES,
  ColumnFilters,
  isOrganisationStatus,
  OrganisationFilters,
  OrganisationQuery,
  Organisation,
  OrganisationStatus,
  SortKey,
  SortState,
  StatusFilter,
} from '../../../core/models/organisation.model';
import { RATE_LIMIT } from '../../../core/services/organisation-api.service';
import { OrganisationService } from '../../../core/services/organisation.service';
import { DEFAULT_PAGE_SIZE, PaginationComponent } from '../../../shared/pagination/pagination.component';
import { StateMessageComponent } from '../../../shared/state-message/state-message.component';
import { OrganisationDetailsComponent } from '../organisation-details/organisation-details.component';
import { OrganisationFiltersComponent } from '../organisation-filters/organisation-filters.component';
import { OrganisationFormComponent } from '../organisation-form/organisation-form.component';
import { OrganisationStatusComponent } from '../organisation-status/organisation-status.component';
import { OrganisationTableComponent } from '../organisation-table/organisation-table.component';

type DialogState = { mode: 'create' } | { mode: 'view' | 'edit'; organisation: Organisation };

const orNull = (value: string): string | null => (value.trim() ? value : null);

@Component({
  selector: 'app-organisation-list',
  standalone: true,
  imports: [
    TranslatePipe,
    PaginationComponent,
    StateMessageComponent,
    OrganisationDetailsComponent,
    OrganisationFiltersComponent,
    OrganisationFormComponent,
    OrganisationStatusComponent,
    OrganisationTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organisation-list.component.html',
  styleUrl: './organisation-list.component.scss',
})
export class OrganisationListComponent {
  protected readonly service = inject(OrganisationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly rateLimit = RATE_LIMIT;
  protected readonly statuses = ALL_STATUSES;
  protected readonly dialogState = signal<DialogState | null>(null);
  protected readonly sort = signal<SortState>({ key: 'name', direction: 'asc' });
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  protected readonly filters = computed<OrganisationFilters>(() => {
    const params = this.queryParams();
    const status = params.get('status') ?? '';
    return {
      q: params.get('q') ?? '',
      name: params.get('name') ?? '',
      status: isOrganisationStatus(status) ? status : '',
      owner: params.get('owner') ?? '',
      minMembers: params.get('min') ?? '',
      created: params.get('created') ?? '',
    };
  });

  protected readonly status = computed(() => this.filters().status);
  protected readonly filtersActive = computed(() => Object.values(this.filters()).some((value) => value.trim() !== ''));
  protected readonly totalMatching = computed(() =>
    Object.values(this.service.statusCounts()).reduce((sum, count) => sum + count, 0),
  );

  private readonly query = computed<OrganisationQuery>(() => {
    const requested = Number(this.queryParams().get('page'));
    return {
      filters: this.filters(),
      sort: this.sort(),
      page: Number.isInteger(requested) && requested > 0 ? requested : 1,
      pageSize: this.pageSize(),
    };
  });

  constructor() {
    effect(
      () => {
        const query = this.query();
        untracked(() => void this.service.load(query));
      },
      { allowSignalWrites: true },
    );
  }

  protected percent(status: OrganisationStatus): number {
    const total = this.totalMatching();
    return total ? (this.service.statusCounts()[status] / total) * 100 : 0;
  }

  protected openDialog(state: DialogState): void {
    this.dialogState.set(state);
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  protected closeDialog(): void {
    this.dialog().nativeElement.close();
  }

  protected setSearch(value: string): void {
    this.updateQuery({ q: orNull(value), page: null });
  }

  protected setStatus(value: StatusFilter): void {
    this.updateQuery({ status: value || null, page: null });
  }

  protected setColumnFilters(value: ColumnFilters): void {
    this.updateQuery({
      name: orNull(value.name),
      status: value.status || null,
      owner: orNull(value.owner),
      min: orNull(value.minMembers),
      created: value.created || null,
      page: null,
    });
  }

  protected clearFilters(): void {
    this.updateQuery({ q: null, name: null, status: null, owner: null, min: null, created: null, page: null });
  }

  protected setPage(page: number): void {
    this.updateQuery({ page: page > 1 ? page : null });
  }

  protected setPageSize(size: number): void {
    this.pageSize.set(size);
    this.updateQuery({ page: null });
  }

  protected toggleSort(key: SortKey): void {
    this.sort.update((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
    this.updateQuery({ page: null });
  }

  private updateQuery(queryParams: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
