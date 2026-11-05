export const KNOWN_STATUSES = ['active', 'inactive', 'suspended'] as const;
export const ALL_STATUSES = [...KNOWN_STATUSES, 'unknown'] as const;

export type KnownStatus = (typeof KNOWN_STATUSES)[number];
export type OrganisationStatus = (typeof ALL_STATUSES)[number];
export type StatusFilter = OrganisationStatus | '';

export function isKnownStatus(value: string): value is KnownStatus {
  return (KNOWN_STATUSES as readonly string[]).includes(value);
}

export function isOrganisationStatus(value: string): value is OrganisationStatus {
  return (ALL_STATUSES as readonly string[]).includes(value);
}

export interface RawOrganisation {
  id: number;
  name?: string | null;
  status?: string | null;
  memberCount?: number | string | null;
  owner?: { email?: string | null } | null;
  createdAt?: string | number | null;
}

export interface Organisation {
  key: string;
  position: number;
  id: number;
  name: string | null;
  status: OrganisationStatus;
  memberCount: number | null;
  ownerEmail: string | null;
  ownerEmailValid: boolean;
  createdAt: number | null;
}

export interface OrganisationInput {
  name: string;
  status: KnownStatus;
  ownerEmail: string;
  memberCount: number | null;
}

export type StatusCounts = Record<OrganisationStatus, number>;

export const emptyStatusCounts = (): StatusCounts => ({ active: 0, inactive: 0, suspended: 0, unknown: 0 });

export interface ListedRecord {
  position: number;
  record: RawOrganisation;
}

export interface OrganisationQuery {
  filters: OrganisationFilters;
  sort: SortState;
  page: number;
  pageSize: number;
}

export interface OrganisationPage {
  items: ListedRecord[];
  total: number;
  page: number;
  statusCounts: StatusCounts;
}

export type SortKey = 'name' | 'status' | 'memberCount' | 'ownerEmail' | 'createdAt';

export interface OrganisationFilters {
  q: string;
  name: string;
  status: StatusFilter;
  owner: string;
  minMembers: string;
  created: string;
}

export type ColumnFilters = Omit<OrganisationFilters, 'q'>;

export interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc';
}
