"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import Image from "next/image";
import Button from "@/components/Button";
import type { BikeListItemDto, CompareResultDto } from "@/lib/types";

interface CompareClientProps {
  allBikes: BikeListItemDto[];
  selectedIds: string[];
  compareResult: CompareResultDto | null;
}

const TABLE_LAYOUT_THRESHOLD = 4;

export default function CompareClient({ allBikes, selectedIds, compareResult }: CompareClientProps) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<string[]>(selectedIds);

  function updateUrl(ids: string[]) {
    setPendingIds(ids);
    const query = ids.length > 0 ? `?ids=${ids.join(",")}` : "";
    router.push(`/compare${query}`);
  }

  function toggleBike(id: string) {
    updateUrl(pendingIds.includes(id) ? pendingIds.filter((x) => x !== id) : [...pendingIds, id]);
  }

  const useTableLayout = (compareResult?.bikes.length ?? 0) > TABLE_LAYOUT_THRESHOLD;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Add bikes to compare</h2>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-zinc-200 rounded-md">
          {allBikes.map((bike) => {
            const isSelected = pendingIds.includes(bike.id);
            return (
              <button
                key={bike.id}
                type="button"
                onClick={() => toggleBike(bike.id)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  isSelected
                    ? "bg-brand-button text-white border-brand-button"
                    : "bg-white text-zinc-700 border-zinc-300 hover:border-brand-button"
                }`}
              >
                {bike.brandName} {bike.modelName}
              </button>
            );
          })}
        </div>
      </div>

      {!compareResult || compareResult.bikes.length === 0 ? (
        <p className="text-zinc-500">Select two or more bikes above to compare specs.</p>
      ) : useTableLayout ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white text-left p-2 border-b border-zinc-200">Spec</th>
                {compareResult.bikes.map((bike) => (
                  <th key={bike.id} className="p-2 border-b border-zinc-200 text-left min-w-[140px]">
                    {bike.brandName} {bike.modelName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareResult.specGroups.map((group) => (
                <Fragment key={group.code}>
                  <tr>
                    <td colSpan={compareResult.bikes.length + 1} className="pt-4 pb-1 font-semibold text-brand-button">
                      {group.name}
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.code} className="border-b border-zinc-100">
                      <td className="sticky left-0 bg-white p-2 text-zinc-500">{row.label}</td>
                      {compareResult.bikes.map((bike) => (
                        <td key={bike.id} className="p-2">
                          {formatValue(row.valuesByBikeId[bike.id], row.unit)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {compareResult.bikes.map((bike) => (
            <div key={bike.id} className="rounded-md border border-zinc-200 overflow-hidden">
              <div className="relative aspect-[4/3] bg-zinc-100">
                {bike.primaryImageUrl && (
                  <Image src={bike.primaryImageUrl} alt={bike.modelName} fill className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-zinc-500">{bike.brandName}</p>
                <p className="font-semibold mb-2">{bike.modelName}</p>
                {compareResult.specGroups.map((group) => (
                  <div key={group.code} className="mb-2">
                    <p className="text-xs font-semibold text-brand-button">{group.name}</p>
                    {group.rows.map((row) => (
                      <div key={row.code} className="flex justify-between text-xs py-0.5">
                        <span className="text-zinc-500">{row.label}</span>
                        <span className="font-medium">{formatValue(row.valuesByBikeId[bike.id], row.unit)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingIds.length > 0 && (
        <div className="mt-4">
          <Button variant="black" onClick={() => updateUrl([])}>
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown, unit: string | null): string {
  if (value === null || value === undefined) return "—";
  return unit ? `${value} ${unit}` : String(value);
}
