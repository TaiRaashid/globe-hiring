import Globe from "./Globe";
import { startups } from "@/data/startups";
import { useMemo, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function App() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = startups.find((s) => s.id === selectedId);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [workMode, setWorkMode] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const filteredStartups = useMemo(() => {
    return startups.filter((s) => {
      if (
        query &&
        !s.name.toLowerCase().includes(query.toLowerCase())
      ) {
        return false;
      }

      if (industry && !s.industries.includes(industry)) {
        return false;
      }

      if (workMode && s.work_mode !== workMode) {
        return false;
      }

      if (country && s.location.country !== country) {
        return false;
      }

      return true;
    });
  }, [query, industry, workMode, country]);

  return (
    <div className="relative w-screen h-screen">

      <Globe
        activeId={selectedId}
        onMarkerClick={(id) => {
          setSelectedId(id);
          setOpen(true);
        }}
        startups = {filteredStartups}
      />

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setSelectedId(null);
        }}
      >
        <SheetContent side="right" className="w-105 sm:w-120 overflow-y-auto">
  {selected && (
    <>
      {/* Header */}
                <SheetHeader>
                  <SheetTitle className="text-xl">{selected.name}</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    {selected.industries.join(" • ")}
                  </p>
                </SheetHeader>

                <div className="mt-6 space-y-6 text-sm">

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-4">
                    <Info label="Founded" value={selected.founded} />
                    <Info label="Work mode" value={selected.work_mode} />
                    <Info label="Team size" value={selected.team_size} />
                    <Info
                      label="Location"
                      value={`${selected.location.city}, ${selected.location.country}`}
                    />
                  </div>

                  {/* About */}
                  <Section title="About">
                    <p className="leading-relaxed text-muted-foreground">
                      {selected.about}
                    </p>
                  </Section>

                  {/* Hiring */}
                  <Section title="Hiring">
                    <p className="mb-2 font-medium">
                      {selected.jobs.total} open positions
                    </p>

                    <ul className="space-y-2">
                      {selected.jobs.positions.slice(0, 5).map((job) => (
                        <li
                          key={job.id}
                          className="rounded-md border p-2 hover:bg-muted transition"
                        >
                          <p className="font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.department} • {job.work_type}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* Founders */}
                  <Section title="Founders">
                    <ul className="space-y-2">
                      {selected.founders.map((f) => (
                        <li key={f.name}>
                          <p className="font-medium">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.title}</p>
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* Funding */}
                  <Section title="Funding">
                    <Info label="Stage" value={selected.funding.stage} />
                    <Info
                      label="Total funding"
                      value={`$${(selected.funding.total / 1_000_000).toFixed(0)}M`}
                    />
                    {selected.funding.valuation && (
                      <Info
                        label="Valuation"
                        value={`$${(selected.funding.valuation / 1_000_000_000).toFixed(
                          1
                        )}B`}
                      />
                    )}
                  </Section>

                  {/* Investors */}
                  {selected.investors.length > 0 && (
                    <Section title="Investors">
                      <div className="flex flex-wrap gap-2">
                        {selected.investors.map((inv) => (
                          <span
                            key={inv}
                            className="rounded-full bg-muted px-2 py-1 text-xs"
                          >
                            {inv}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              </>
            )}
          </SheetContent>

      </Sheet>
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default App;
