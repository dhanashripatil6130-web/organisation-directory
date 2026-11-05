import { Organisation, SortState } from '../models/organisation.model';

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

function compare(a: Organisation, b: Organisation, { key, direction }: SortState): number {
  const left = a[key];
  const right = b[key];

  if (left === null || right === null) {
    return left === right ? 0 : left === null ? 1 : -1;
  }

  const result =
    typeof left === 'string' && typeof right === 'string' ? collator.compare(left, right) : Number(left) - Number(right);
  return direction === 'asc' ? result : -result;
}

export function sortOrganisations(organisations: Organisation[], sort: SortState): Organisation[] {
  return [...organisations].sort((a, b) => compare(a, b, sort));
}
