"use client";

import type { Filters } from "@/types/filters";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Props = {
  filters: Filters;
  setFilters: (f: Filters) => void;
  availableIndustries: { name: string; count: number }[];
};

export function FilterPanel({
  filters,
  setFilters,
  availableIndustries,
}: Props) {
  function toggleIndustry(ind: string) {
    setFilters({
      ...filters,
      industries: filters.industries.includes(ind)
        ? filters.industries.filter((i) => i !== ind)
        : [...filters.industries, ind],
    });
  }

  function toggleWorkMode(mode: Filters["workModes"][number]) {
    setFilters({
      ...filters,
      workModes: filters.workModes.includes(mode)
        ? filters.workModes.filter((m) => m !== mode)
        : [...filters.workModes, mode],
    });
  }

  return (
    <div
      className="
        absolute top-20 left-4 z-20
        w-72 rounded-2xl border
        bg-background/85 backdrop-blur-xl
        shadow-xl
        p-4 space-y-6
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ industries: [], workModes: [], hiringOnly: false })
          }
          className="h-auto px-2 text-xs"
        >
          Clear
        </Button>
      </div>

      {/* Industries */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Industry
        </p>

        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {availableIndustries.map((i) => {
            const selected = filters.industries.includes(i.name);

            return (
              <Button
                key={i.name}
                size="sm"
                variant={selected ? "secondary" : "outline"}
                onClick={() => toggleIndustry(i.name)}
                className="h-7 px-3 text-xs"
              >
                {i.name}
                <span className="ml-1 text-muted-foreground">
                  · {i.count}
                </span>
              </Button>
            );
          })}
        </div>
      </section>

      {/* Work Mode */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          Work mode
        </p>

        {(["Remote", "Hybrid", "On-site"] as const).map((mode) => (
          <label
            key={mode}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={filters.workModes.includes(mode)}
              onChange={() => toggleWorkMode(mode)}
              className="accent-primary"
            />
            {mode}
          </label>
        ))}
      </section>

      {/* Hiring */}
      <section className="flex items-center justify-between">
        <p className="text-sm">Hiring only</p>
        <Switch
          checked={filters.hiringOnly}
          onCheckedChange={(v: boolean) =>
            setFilters({ ...filters, hiringOnly: v })
          }
        />
      </section>
    </div>
  );
}
