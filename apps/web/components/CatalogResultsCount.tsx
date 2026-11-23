'use client';

import { useEffect, useState } from 'react';
import { getBikes } from '@/lib/api';
import type { BikesQuery } from '@/lib/types';

export default function CatalogResultsCount({
  initialTotalCount,
  query,
}: {
  initialTotalCount: number;
  query: BikesQuery;
}) {
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const serializedQuery = JSON.stringify(query);

  useEffect(() => {
    let active = true;
    const requestQuery = JSON.parse(serializedQuery) as BikesQuery;
    getBikes(requestQuery)
      .then((result) => {
        if (active) {
          setTotalCount(result.totalCount);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [serializedQuery]);

  return (
    <p className="shrink-0 text-sm text-brand-grey" role="status">
      {totalCount} {totalCount === 1 ? 'bike' : 'bikes'}
    </p>
  );
}
