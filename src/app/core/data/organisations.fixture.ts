import { RawOrganisation } from '../models/organisation.model';

export const RAW_FIXTURE: RawOrganisation[] = [
  {
    id: 1,
    name: 'Northwind Traders',
    status: 'active',
    memberCount: 42,
    owner: { email: 'ops@northwind.example' },
    createdAt: '2024-03-11T09:12:00Z',
  },
  {
    id: 2,
    name: '',
    status: 'ACTIVE',
    memberCount: '12',
    owner: { email: 'a@b.example' },
    createdAt: 1710150720000,
  },
  { id: 3, name: null, status: 'Active', memberCount: -1, createdAt: '2024-01-02T00:00:00Z' },
  {
    id: 42,
    name: 'Globex Corporation',
    status: 'suspended',
    memberCount: 7,
    owner: { email: 'hq@globex.example' },
    createdAt: '2023-11-30T14:45:10Z',
  },
  {
    id: 42,
    name: 'Globex Corporation Ltd',
    status: 'actve',
    memberCount: 7,
    owner: { email: 'hq@globex.example' },
    createdAt: '2023-11-30T14:45:10Z',
  },
  {
    id: 6,
    name: 'شركة الأمل 🚀',
    status: 'active',
    memberCount: 3,
    owner: { email: 'info@amal.example' },
    createdAt: '2025-06-01T08:00:00Z',
  },
  {
    id: 7,
    name: 'The Very Long Organisation Name That Somebody Actually Typed Into The Field Because Nobody Validated It And It Keeps Going Well Past Any Reasonable Column Width And Still Has Not Stopped',
    status: 'inactive',
    memberCount: 0,
    owner: { email: 'long@example.com' },
    createdAt: '2024-07-19T16:20:00Z',
  },
  {
    id: 8,
    name: 'Initech',
    status: null,
    memberCount: null,
    owner: { email: 'not-an-email' },
    createdAt: 'not a date',
  },
];

export const TOTAL_RECORDS = 137;

const DAY_MS = 86_400_000;
const MAX_VARIED_NAME_LENGTH = 60;

function shiftDate(value: RawOrganisation['createdAt'], days: number): RawOrganisation['createdAt'] {
  if (typeof value === 'number') {
    return value + days * DAY_MS;
  }
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? value : new Date(parsed + days * DAY_MS).toISOString();
}

export function buildDataset(): RawOrganisation[] {
  const records = [...RAW_FIXTURE];

  for (let index = RAW_FIXTURE.length; index < TOTAL_RECORDS; index++) {
    const base = RAW_FIXTURE[index % RAW_FIXTURE.length];
    const position = index + 1;
    const hasShortName = typeof base.name === 'string' && base.name !== '' && base.name.length < MAX_VARIED_NAME_LENGTH;

    records.push({
      ...base,
      id: index % 17 === 0 ? records[index - 1].id : 100 + position,
      name: hasShortName ? `${base.name} ${position}` : base.name,
      memberCount: typeof base.memberCount === 'number' && base.memberCount > 0 ? base.memberCount + position : base.memberCount,
      createdAt: shiftDate(base.createdAt, position),
    });
  }

  return records;
}
