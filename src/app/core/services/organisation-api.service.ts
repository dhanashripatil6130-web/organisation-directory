import { inject, Injectable } from '@angular/core';
import { defer, map, Observable, timer } from 'rxjs';
import { buildDataset } from '../data/organisations.fixture';
import { I18nService } from '../i18n/i18n.service';
import {
  emptyStatusCounts,
  ListedRecord,
  OrganisationInput,
  OrganisationPage,
  OrganisationQuery,
  OrganisationStatus,
  RawOrganisation,
} from '../models/organisation.model';
import { filterOrganisations } from '../utils/filter-organisations';
import { normalizeOrganisation } from '../utils/normalize-organisation';
import { sortOrganisations } from '../utils/sort-organisations';

export const MAX_PAGE_SIZE = 25;
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 60_000;

const MIN_DELAY_MS = 400;
const MAX_DELAY_MS = 900;
const FAILURE_RATE = 0.15;

export type ApiErrorCode = 'bad-request' | 'rate-limited' | 'server-error' | 'duplicate';

export class ApiError extends Error {
  constructor(readonly code: ApiErrorCode) {
    super(code);
  }
}

const randomDelay = (): number => MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
const normaliseName = (name: string | null | undefined): string => (name ?? '').trim().toLowerCase();

@Injectable({ providedIn: 'root' })
export class OrganisationApiService {
  private readonly i18n = inject(I18nService);
  private readonly records = buildDataset();
  private requestTimes: number[] = [];

  list(query: OrganisationQuery): Observable<OrganisationPage> {
    return defer(() => {
      const error =
        this.checkRequest(query.pageSize) ?? (Math.random() < FAILURE_RATE ? new ApiError('server-error') : null);

      return timer(randomDelay()).pipe(
        map(() => {
          if (error) {
            throw error;
          }
          return this.runQuery(query);
        }),
      );
    });
  }

  create(input: OrganisationInput): Observable<ListedRecord> {
    return this.write(input, null, (previous) => ({
      ...previous,
      id: 1000 + this.records.length,
      createdAt: new Date().toISOString(),
    }));
  }

  update(position: number, input: OrganisationInput): Observable<ListedRecord> {
    return this.write(input, position, (previous) => previous);
  }

  nameTaken(name: string, excludePosition: number | null): Observable<boolean> {
    return defer(() => {
      const taken = this.isNameTaken(normaliseName(name), excludePosition);
      return timer(randomDelay()).pipe(map(() => taken));
    });
  }

  private write(
    input: OrganisationInput,
    position: number | null,
    base: (previous: RawOrganisation) => RawOrganisation,
  ): Observable<ListedRecord> {
    return defer(() => {
      const duplicate = this.isNameTaken(normaliseName(input.name), position);

      return timer(randomDelay()).pipe(
        map(() => {
          if (duplicate) {
            throw new ApiError('duplicate');
          }
          const target = position ?? this.records.length;
          const record: RawOrganisation = {
            ...base(this.records[target] ?? { id: 0 }),
            name: input.name.trim(),
            status: input.status,
            memberCount: input.memberCount,
            owner: { email: input.ownerEmail.trim() },
          };
          this.records[target] = record;
          return { position: target, record };
        }),
      );
    });
  }

  private isNameTaken(name: string, excludePosition: number | null): boolean {
    return this.records.some((record, position) => position !== excludePosition && normaliseName(record.name) === name);
  }

  private runQuery({ filters, sort, page, pageSize }: OrganisationQuery): OrganisationPage {
    const statusLabel = (status: OrganisationStatus): string => this.i18n.t(`status.${status}`);
    const all = this.records.map((record, position) => normalizeOrganisation(record, position));
    const matching = filterOrganisations(all, { ...filters, status: '' }, statusLabel);

    const statusCounts = emptyStatusCounts();
    for (const org of matching) {
      statusCounts[org.status]++;
    }

    const filtered = sortOrganisations(
      filters.status ? matching.filter((org) => org.status === filters.status) : matching,
      sort,
    );
    const current = Math.min(Math.max(page, 1), Math.max(1, Math.ceil(filtered.length / pageSize)));
    const start = (current - 1) * pageSize;

    return {
      items: filtered
        .slice(start, start + pageSize)
        .map((org) => ({ position: org.position, record: this.records[org.position] })),
      total: filtered.length,
      page: current,
      statusCounts,
    };
  }

  private checkRequest(pageSize: number): ApiError | null {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter((time) => now - time < RATE_WINDOW_MS);
    this.requestTimes.push(now);

    if (pageSize > MAX_PAGE_SIZE || pageSize < 1) {
      return new ApiError('bad-request');
    }
    return this.requestTimes.length > RATE_LIMIT ? new ApiError('rate-limited') : null;
  }
}
