import type { Filters } from "@/types/filters";

type Props = {
  filters: Filters;
  onRemove: (key: keyof Filters, value?: string) => void;
};

export function ActiveFilters({ filters, onRemove }: Props) {
  const pills: {
    label: string;
    key: keyof Filters;
    value?: string;
    }[] = [
    ...filters.industries.map((i) => ({
        label: i,
        key: "industries" as const,
        value: i,
    })),
    ...filters.workModes.map((m) => ({
        label: m,
        key: "workModes" as const,
        value: m,
    })),
    ...(filters.hiringOnly
        ? [{ label: "Hiring", key: "hiringOnly" as const }]
        : []),
    ];

  if (pills.length === 0) return null;

  return (
    <div className="
      absolute top-20 left-1/2 -translate-x-1/2 z-20
      flex flex-wrap gap-2
    ">
      {pills.map((p, i) => (
        <button
          key={i}
          onClick={() => onRemove(p.key, p.value)}
          className="
            rounded-full bg-muted px-3 py-1 text-xs
            hover:bg-muted/70
          "
        >
          {p.label} ✕
        </button>
      ))}
    </div>
  );
}
