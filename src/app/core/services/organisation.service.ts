import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import {
  emptyStatusCounts,
  Organisation,
  OrganisationInput,
  OrganisationPage,
  OrganisationQuery,
} from '../models/organisation.model';
import { normalizeOrganisation } from '../utils/normalize-organisation';
import { OrganisationApiService, RATE_LIMIT, RATE_WINDOW_MS } from './organisation-api.service';

const MAX_ATTEMPTS = 3;
const RATE_MARGIN_MS = 50;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  private readonly api = inject(OrganisationApiService);
  private readonly cache = new Map<string, OrganisationPage>();
  private readonly items = signal<Organisation[]>([]);
  private readonly totalCount = signal(0);
  private readonly currentPage = signal(1);
  private readonly counts = signal(emptyStatusCounts());
  private readonly isLoaded = signal(false);
  private readonly isLoading = signal(false);
  private readonly isWaiting = signal(false);
  private readonly hasError = signal(false);
  private requestTimes: number[] = [];
  private requestId = 0;
  private lastQuery: OrganisationQuery | null = null;

  readonly organisations = this.items.asReadonly();
  readonly total = this.totalCount.asReadonly();
  readonly page = this.currentPage.asReadonly();
  readonly statusCounts = this.counts.asReadonly();
  readonly loaded = this.isLoaded.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly waitingForRateLimit = this.isWaiting.asReadonly();
  readonly error = this.hasError.asReadonly();

  async load(query: OrganisationQuery): Promise<void> {
    this.lastQuery = query;
    const id = ++this.requestId;
    const key = JSON.stringify(query);
    const cached = this.cache.get(key);

    this.hasError.set(false);
    if (cached) {
      this.apply(cached);
      this.isLoading.set(false);
      this.isWaiting.set(false);
      return;
    }

    this.isLoading.set(true);
    try {
      const page = await this.fetchPage(query, id);
      if (page && id === this.requestId) {
        this.cache.set(key, page);
        this.apply(page);
      }
    } catch {
      if (id === this.requestId) {
        this.hasError.set(true);
      }
    } finally {
      if (id === this.requestId) {
        this.isLoading.set(false);
        this.isWaiting.set(false);
      }
    }
  }

  retry(): void {
    if (this.lastQuery) {
      void this.load(this.lastQuery);
    }
  }

  async create(input: OrganisationInput): Promise<Organisation> {
    const { record, position } = await firstValueFrom(this.api.create(input));
    this.refresh();
    return normalizeOrganisation(record, position);
  }

  async update(current: Organisation, input: OrganisationInput): Promise<Organisation> {
    const { record, position } = await firstValueFrom(this.api.update(current.position, input));
    this.refresh();
    return normalizeOrganisation(record, position);
  }

  isNameTaken(name: string, excludePosition: number | null): Observable<boolean> {
    return this.api.nameTaken(name, excludePosition);
  }

  private apply(page: OrganisationPage): void {
    this.items.set(page.items.map(({ record, position }) => normalizeOrganisation(record, position)));
    this.totalCount.set(page.total);
    this.currentPage.set(page.page);
    this.counts.set(page.statusCounts);
    this.isLoaded.set(true);
  }

  private refresh(): void {
    this.cache.clear();
    this.retry();
  }

  private async fetchPage(query: OrganisationQuery, id: number): Promise<OrganisationPage | null> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (!(await this.waitForRateSlot(id))) {
        return null;
      }
      try {
        return await firstValueFrom(this.api.list(query));
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  private async waitForRateSlot(id: number): Promise<boolean> {
    for (;;) {
      if (id !== this.requestId) {
        return false;
      }

      const now = Date.now();
      this.requestTimes = this.requestTimes.filter((time) => now - time < RATE_WINDOW_MS);

      if (this.requestTimes.length < RATE_LIMIT) {
        this.requestTimes.push(now);
        this.isWaiting.set(false);
        return true;
      }

      this.isWaiting.set(true);
      await sleep(this.requestTimes[0] + RATE_WINDOW_MS - now + RATE_MARGIN_MS);
    }
  }
}
