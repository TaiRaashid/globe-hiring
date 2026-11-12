import type { Startup } from "@/types/startup";
import { Button } from "@/components/ui/button";

type Props = {
  startups: Startup[];
  onRemove: (id: string) => void;
};

export function ComparePanel({ startups, onRemove }: Props) {
  if (startups.length < 2) return null;

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-175 border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-muted-foreground px-3">
              Metric
            </th>

            {startups.map((s) => (
              <th key={s.id} className="text-left px-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{s.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove(s.id)}
                  >
                    ✕
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-sm">
          <Row label="Founded" values={startups.map((s) => s.founded)} />
          <Row label="Team size" values={startups.map((s) => s.team_size)} />
          <Row label="Work mode" values={startups.map((s) => s.work_mode)} />
          <Row
            label="Location"
            values={startups.map(
              (s) => `${s.location.city}, ${s.location.country}`
            )}
          />
          <Row
            label="Industries"
            values={startups.map((s) => s.industries.join(", "))}
          />
          <Row
            label="Funding stage"
            values={startups.map((s) => s.funding.stage)}
          />
          <Row
            label="Total funding"
            values={startups.map(
              (s) => `$${(s.funding.total / 1_000_000).toFixed(0)}M`
            )}
          />
          <Row
            label="Valuation"
            values={startups.map((s) =>
              s.funding.valuation
                ? `$${(s.funding.valuation / 1_000_000_000).toFixed(1)}B`
                : "—"
            )}
          />
          <Row
            label="Open roles"
            values={startups.map((s) => s.jobs.total)}
          />
          <Row
            label="Top job areas"
            values={startups.map((s) =>
              Array.from(
                new Set(s.jobs.positions.map((p) => p.department))
              )
                .slice(0, 3)
                .join(", ")
            )}
          />
          <Row
            label="Investors"
            values={startups.map((s) => s.investors.join(", "))}
          />
        </tbody>
      </table>
    </div>
  );
}

function Row({
  label,
  values,
}: {
  label: string;
  values: (string | number)[];
}) {
  return (
    <tr className="bg-muted/40 rounded-lg">
      <td className="px-3 py-2 text-xs text-muted-foreground font-medium">
        {label}
      </td>

      {values.map((v, i) => (
        <td key={i} className="px-3 py-2">
          {v}
        </td>
      ))}
    </tr>
  );
}
