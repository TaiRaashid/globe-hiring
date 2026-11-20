import type { Company } from "@/types/company";
import { formatWorkMode } from "@/types/company";
import { Button } from "@/components/ui/button";

type Props = {
  companies: Company[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  onCompare: (id: string) => void;
  compareIds: string[];
  totalCompanies: number;
};

export function CompanyDirectory({
  companies,
  open,
  onOpenChange,
  onSelect,
  onCompare,
  compareIds,
  totalCompanies,
}: Props) {
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className="absolute right-4 top-20 z-30 shadow-lg"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls="company-directory-panel"
      >
        {open ? "Hide companies" : `Companies (${companies.length})`}
      </Button>

      {open && (
        <section
          id="company-directory-panel"
          aria-label="Company directory"
          className="absolute right-4 top-32 z-30 flex max-h-[calc(100vh-10rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-background/95 shadow-2xl backdrop-blur-xl"
        >
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Explore companies</h2>
              <p className="text-xs text-muted-foreground">
                {companies.length} matching {companies.length === 1 ? "company" : "companies"}
                {totalCompanies !== companies.length ? ` of ${totalCompanies}` : ""}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {companies.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium">No matching companies</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try another search or remove some filters.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {companies.map((company) => {
                  const isCompared = compareIds.includes(company.id);
                  return (
                    <li key={company.id}>
                      <div className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-muted/70">
                        <button
                          type="button"
                          onClick={() => onSelect(company.id)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt=""
                              loading="lazy"
                              className="h-10 w-10 shrink-0 rounded-lg border bg-background object-contain p-1"
                            />
                          ) : (
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border bg-muted text-sm font-semibold">
                              {company.name.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {company.name}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {company.location
                                ? [company.location.city, company.location.country].filter(Boolean).join(", ")
                                : "Location not available"}
                            </span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">
                              {company.industries.slice(0, 2).join(" · ") || "Industry not specified"}
                            </span>
                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              {formatWorkMode(company.workMode)}
                            </span>
                          </span>
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          variant={isCompared ? "secondary" : "ghost"}
                          className="h-7 shrink-0 px-2 text-xs"
                          onClick={() => onCompare(company.id)}
                          aria-label={`${isCompared ? "Remove" : "Add"} ${company.name} ${isCompared ? "from" : "to"} comparison`}
                        >
                          {isCompared ? "Added" : "Compare"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <footer className="border-t px-4 py-2 text-[11px] text-muted-foreground">
            Select a company to view its profile and focus the globe on its location.
          </footer>
        </section>
      )}
    </>
  );
}
