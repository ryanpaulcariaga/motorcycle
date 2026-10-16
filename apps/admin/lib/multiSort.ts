export type SortDirection = 'asc' | 'desc';
export type SortRule<K extends string = string> = {
  field: K;
  direction: SortDirection;
};

export function sortRows<T, K extends string>(
  rows: T[],
  rules: SortRule<K>[],
  comparers: Record<K, (left: T, right: T) => number>,
  fallback?: (left: T, right: T) => number
): T[] {
  return [...rows].sort((left, right) => {
    for (const rule of rules) {
      const result = comparers[rule.field](left, right);
      if (result !== 0) {
        return rule.direction === 'asc' ? result : -result;
      }
    }
    return fallback ? fallback(left, right) : 0;
  });
}

export function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

// Accepts "field:dir,field:dir"; a bare "field" with the legacy `direction`
// parameter is also understood so older bookmarks keep working.
export function parseSortRules<K extends string>(
  value: string | null,
  legacyDirection: string | null,
  allowed: readonly K[],
  fallback: SortRule<K>[]
): SortRule<K>[] {
  if (!value) {
    return fallback;
  }
  const rules: SortRule<K>[] = [];
  for (const part of value.split(',')) {
    const [field, direction] = part.split(':');
    if (
      !allowed.includes(field as K) ||
      rules.some((rule) => rule.field === field)
    ) {
      continue;
    }
    const resolved = direction ?? legacyDirection;
    rules.push({
      field: field as K,
      direction: resolved === 'desc' ? 'desc' : 'asc',
    });
  }
  return rules.length > 0 ? rules : fallback;
}

export function serializeSortRules(
  rules: SortRule[],
  fallback: SortRule[]
): string {
  const serialize = (list: SortRule[]) =>
    list.map((rule) => `${rule.field}:${rule.direction}`).join(',');
  const value = serialize(rules);
  return value === serialize(fallback) ? '' : value;
}
