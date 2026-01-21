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
        <SheetContent side="right" className="w-105 sm:w-120 overflow-y-auto bg-background/95 backdrop-blur-xl border-l shadow-2xl px-6 py-6">
          {selected && (
              <>
              {/* Header */}
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-2xl tracking-tight">
                    {selected.name}
                  </SheetTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selected.industries.map((i) => (
                      <span
                        key={i}
                        className="
                          rounded-full
                          bg-primary/10
                          px-3 py-1
                          text-xs font-medium
                          text-primary
                        "
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </SheetHeader>

                <Separator />

                <div className="mt-8 space-y-10 text-sm">

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-4">
                    <MetaCard label="Founded" value={selected.founded} />
                    <MetaCard label="Work mode" value={selected.work_mode} />
                    <MetaCard label="Team size" value={selected.team_size} />
                    <MetaCard
                      label="Location"
                      value={`${selected.location.city}, ${selected.location.country}`}
                    />
                  </div>
                  <div className="space-y-2">
                    {/* About */}
                    <Section title="About">
                      <p className="leading-relaxed text-muted-foreground">
                        {selected.about}
                      </p>
                    </Section>

                    <Separator />

                    {/* Hiring */}
                    <Section title="Hiring">
                      <p className="mb-2 font-medium">
                        {selected.jobs.total} open positions
                      </p>

                      <ul className="space-y-2">
                        {selected.jobs.positions.slice(0, 5).map((job) => (
                          <li
                            key={job.id}
                            className="rounded-lg border p-3 transition hover:border-primary/40 hover:bg-primary/5"                        >
                            <p className="font-medium">{job.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.department} • {job.work_type}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </Section>

                    <Separator />

                    {/* Founders */}
                    <Section title="Founders">
                      <ul className="space-y-3">
                        {selected.founders.map((f) => (
                          <li key={f.name}>
                            <p className="font-medium">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{f.title}</p>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  </div>
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
                            className="rounded-full border px-3 py-1 text-xs bg-background text-muted-foreground"
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
    <section className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Separator() {
  return (
    <div className="relative h-px w-full">
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-border/60 to-transparent" />
    </div>
  );
}


function MetaCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="grid grid-cols-2 gap-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-medium">{value}</p>
      </div>
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
