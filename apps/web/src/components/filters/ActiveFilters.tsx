import type { Filters } from "@/types/filters";
import { formatWorkMode } from "@/types/company";

type Props = {
  filters: Filters;
  onRemove: (key: keyof Filters, value: string) => void;
};

export function ActiveFilters({ filters, onRemove }: Props) {
  const pills = [
    ...filters.industries.map((industry) => ({
      label: industry,
      key: "industries" as const,
      value: industry,
    })),
    ...filters.workModes.map((mode) => ({
      label: formatWorkMode(mode),
      key: "workModes" as const,
      value: mode,
    })),
  ];

  if (!pills.length) return null;

  return (
    <div className="absolute top-20 left-1/2 z-20 flex -translate-x-1/2 flex-wrap gap-2">
      {pills.map((pill) => (
        <button
          key={`${pill.key}-${pill.value}`}
          onClick={() => onRemove(pill.key, pill.value)}
          className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/70"
        >
          {pill.label} ✕
        </button>
      ))}
    </div>
  );
}
