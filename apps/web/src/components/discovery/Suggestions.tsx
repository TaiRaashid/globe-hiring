import type { Company } from "@/types/company";

export function Suggestions({
  companies,
  currentId,
  onSelect,
}: {
  companies: Company[];
  currentId: string;
  onSelect: (id: string) => void;
}) {
  const current = companies.find((company) => company.id === currentId);
  if (!current) return null;

  const matches = companies
    .filter(
      (company) =>
        company.id !== currentId &&
        company.industries.some((industry) => current.industries.includes(industry)),
    )
    .slice(0, 3);

  if (!matches.length) return null;

  return (
    <div className="mt-6 space-y-2">
      <p className="text-xs font-semibold">You may also like</p>
      {matches.map((company) => (
        <button
          key={company.id}
          onClick={() => onSelect(company.id)}
          className="block w-full rounded-md border px-2 py-2 text-left hover:bg-muted"
        >
          {company.name}
        </button>
      ))}
    </div>
  );
}
