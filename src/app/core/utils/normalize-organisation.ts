import { isKnownStatus, Organisation, OrganisationStatus, RawOrganisation } from '../models/organisation.model';
import { isValidEmail } from './email';

const MAX_DATE_MS = 8.64e15;

function toName(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function toStatus(value: unknown): OrganisationStatus {
  const normalised = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return isKnownStatus(normalised) ? normalised : 'unknown';
}

function toMemberCount(value: unknown): number | null {
  const count =
    typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isInteger(count) && count >= 0 ? count : null;
}

function toTimestamp(value: unknown): number | null {
  const time = typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(time) && Math.abs(time) <= MAX_DATE_MS ? time : null;
}

export function normalizeOrganisation(raw: RawOrganisation, index: number): Organisation {
  const ownerEmail = toName(raw.owner?.email);

  return {
    key: `${raw.id}:${index}`,
    position: index,
    id: raw.id,
    name: toName(raw.name),
    status: toStatus(raw.status),
    memberCount: toMemberCount(raw.memberCount),
    ownerEmail,
    ownerEmailValid: ownerEmail !== null && isValidEmail(ownerEmail),
    createdAt: toTimestamp(raw.createdAt),
  };
}
