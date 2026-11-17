import type { Company } from "@/types/company";

export function RecentPanel({
  companies,
  ids,
  onSelect,
}: {
  companies: Company[];
  ids: string[];
  onSelect: (id: string) => void;
}) {
  const recentCompanies = ids
    .map((id) => companies.find((company) => company.id === id))
    .filter((company): company is Company => company !== undefined);

  if (!recentCompanies.length) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20 w-64 space-y-2 rounded-xl border bg-background p-3">
      <p className="text-xs font-semibold">Recently viewed</p>
      {recentCompanies.map((company) => (
        <button
          key={company.id}
          onClick={() => onSelect(company.id)}
          className="w-full rounded px-2 py-1 text-left text-sm hover:bg-muted"
        >
          {company.name}
        </button>
      ))}
    </div>
  );
}
