import { Organisation, OrganisationFilters, OrganisationStatus } from '../models/organisation.model';

const DAY_MS = 86_400_000;
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

const contains = (value: string | null, needle: string): boolean => (value ?? '').toLowerCase().includes(needle);

function searchText(org: Organisation, statusLabel: (status: OrganisationStatus) => string): string {
  const date = org.createdAt === null ? null : `${new Date(org.createdAt).toISOString().slice(0, 10)} ${dateFormat.format(org.createdAt)}`;
  return [org.name, statusLabel(org.status), org.ownerEmail, org.memberCount, date]
    .filter((value) => value !== null)
    .join('\n')
    .toLowerCase();
}

export function filterOrganisations(
  organisations: Organisation[],
  filters: OrganisationFilters,
  statusLabel: (status: OrganisationStatus) => string,
): Organisation[] {
  const query = filters.q.trim().toLowerCase();
  const name = filters.name.trim().toLowerCase();
  const owner = filters.owner.trim().toLowerCase();
  const minMembers = filters.minMembers.trim() === '' ? NaN : Number(filters.minMembers);
  const dayStart = filters.created ? Date.parse(filters.created) : NaN;

  return organisations.filter(
    (org) =>
      (!filters.status || org.status === filters.status) &&
      (!name || contains(org.name, name)) &&
      (!owner || contains(org.ownerEmail, owner)) &&
      (Number.isNaN(minMembers) || (org.memberCount !== null && org.memberCount >= minMembers)) &&
      (Number.isNaN(dayStart) ||
        (org.createdAt !== null && org.createdAt >= dayStart && org.createdAt < dayStart + DAY_MS)) &&
      (!query || searchText(org, statusLabel).includes(query)),
  );
}
