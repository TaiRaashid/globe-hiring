import type { Filters } from "@/types/filters";

type Preset = {
  label: string;
  apply: (f: Filters) => Filters;
};

const presets: Preset[] = [
  {
    label: "🔥 Hiring hotspots",
    apply: (f) => ({ ...f, hiringOnly: true }),
  },
  {
    label: "🌍 Remote friendly",
    apply: (f) => ({
      ...f,
      workModes: ["Remote"],
    }),
  },
  {
    label: "🧠 AI startups",
    apply: (f) => ({
      ...f,
      industries: ["AI"],
    }),
  },
];

export function ExplorePresets({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  return (
    <div className="absolute top-20 right-4 z-20 space-y-2">
      {presets.map((p) => (
        <button
          key={p.label}
          onClick={() => setFilters(p.apply(filters))}
          className="rounded-lg bg-background/90 border px-3 py-2 text-xs hover:bg-muted"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
