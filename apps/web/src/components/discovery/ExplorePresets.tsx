import type { Filters } from "@/types/filters";

type Preset = {
  label: string;
  apply: (filters: Filters) => Filters;
};

const presets: Preset[] = [
  {
    label: "🌍 Remote friendly",
    apply: (filters) => ({ ...filters, workModes: ["remote"] }),
  },
  {
    label: "🧠 AI companies",
    apply: (filters) => ({
      ...filters,
      industries: ["AI", "Artificial Intelligence"],
    }),
  },
];

export function ExplorePresets({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}) {
  return (
    <div className="absolute top-20 right-4 z-20 space-y-2">
      {presets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => setFilters(preset.apply(filters))}
          className="rounded-lg border bg-background/90 px-3 py-2 text-xs hover:bg-muted"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
