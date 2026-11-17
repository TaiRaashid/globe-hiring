import type { Company } from "@/types/company";
import { formatWorkMode } from "@/types/company";
import { Button } from "@/components/ui/button";

type Props = {
  companies: Company[];
  onRemove: (id: string) => void;
};

export function ComparePanel({ companies, onRemove }: Props) {
  if (companies.length < 2) return null;

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-175 border-separate border-spacing-y-2">
        <thead>
          <tr>
            <th className="px-3 text-left text-xs font-medium text-muted-foreground">Metric</th>
            {companies.map((company) => (
              <th key={company.id} className="px-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{company.name}</span>
                  <Button size="icon" variant="ghost" onClick={() => onRemove(company.id)}>
                    ✕
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          <Row label="Founded" values={companies.map((company) => company.foundedYear ?? "—")} />
          <Row label="Team size" values={companies.map((company) => company.teamSizeLabel ?? "—")} />
          <Row label="Work mode" values={companies.map((company) => formatWorkMode(company.workMode))} />
          <Row
            label="Location"
            values={companies.map((company) =>
              company.location
                ? `${company.location.city}, ${company.location.country}`
                : "Not available",
            )}
          />
          <Row label="Industries" values={companies.map((company) => company.industries.join(", ") || "—")} />
          <Row label="Funding stage" values={companies.map((company) => company.fundingStage ?? "—")} />
          <Row
            label="Total funding"
            values={companies.map((company) =>
              company.fundingTotal > 0
                ? `$${(company.fundingTotal / 1_000_000).toFixed(0)}M`
                : "Not disclosed",
            )}
          />
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, values }: { label: string; values: (string | number)[] }) {
  return (
    <tr className="rounded-lg bg-muted/40">
      <td className="px-3 py-2 text-xs font-medium text-muted-foreground">{label}</td>
      {values.map((value, index) => (
        <td key={index} className="px-3 py-2">{value}</td>
      ))}
    </tr>
  );
}
