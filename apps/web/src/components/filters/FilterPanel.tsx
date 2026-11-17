import type { Filters } from "@/types/filters";
import { Button } from "@/components/ui/button";

type Props = {
  filters: Filters;
  setFilters: (f: Filters) => void;
  availableIndustries: { name: string; count: number }[];
};

const workModes: { value: Filters["workModes"][number]; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site" },
];

export function FilterPanel({ filters, setFilters, availableIndustries }: Props) {
  function toggleIndustry(industry: string) {
    setFilters({
      ...filters,
      industries: filters.industries.includes(industry)
        ? filters.industries.filter((item) => item !== industry)
        : [...filters.industries, industry],
    });
  }

  function toggleWorkMode(mode: Filters["workModes"][number]) {
    setFilters({
      ...filters,
      workModes: filters.workModes.includes(mode)
        ? filters.workModes.filter((item) => item !== mode)
        : [...filters.workModes, mode],
    });
  }

  return (
    <div className="absolute top-20 left-4 z-20 w-72 rounded-2xl border bg-background/85 p-4 shadow-xl backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilters({ industries: [], workModes: [] })}
          className="h-auto px-2 text-xs"
        >
          Clear
        </Button>
      </div>

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">Industry</p>
        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
          {availableIndustries.map((industry) => {
            const selected = filters.industries.includes(industry.name);
            return (
              <Button
                key={industry.name}
                size="sm"
                variant={selected ? "secondary" : "outline"}
                onClick={() => toggleIndustry(industry.name)}
                className="h-7 px-3 text-xs"
              >
                {industry.name}
                <span className="ml-1 text-muted-foreground">· {industry.count}</span>
              </Button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">Work mode</p>
        {workModes.map((mode) => (
          <label key={mode.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.workModes.includes(mode.value)}
              onChange={() => toggleWorkMode(mode.value)}
              className="accent-primary"
            />
            {mode.label}
          </label>
        ))}
      </section>
    </div>
  );
}
