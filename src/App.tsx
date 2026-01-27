import Globe from "./Globe";
import { startups } from "@/data/startups";
import { useEffect, useRef, useState, forwardRef} from "react";
import type { MapRef } from "@/components/map";
import { geocodeSuggestions, type GeocodeSuggestion } from "@/utils/geocode";
import { useDebounce } from "@/hooks/useDebounce";
import { buildSearchIndex, searchIndex } from "@/utils/search";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Building2,
  Briefcase,
  Layers,
  MapPin,
} from "lucide-react";

function App() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = startups.find((s) => s.id === selectedId);
  const globeRef = useRef<MapRef | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query,500);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const searchIndexRef = useRef(buildSearchIndex(startups));
  const domainResults = searchIndex(searchIndexRef.current, debouncedQuery);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [appliedFilterIds, setAppliedFilterIds] = useState<string[] | null>(null);

  type UIResult =
    | {
        key: string;
        type: "startup";
        title: string;
        subtitle: string;
        startupId: string;
      }
    | {
        key: string;
        type: "industry";
        title: string;
      }
    | {
        key: string;
        type: "job";
        title: string;
        subtitle: string;
        startupId: string;
        isHiring: boolean;
      }
    | {
        key: string;
        type: "location";
        title: string;
        place: GeocodeSuggestion;
      };

  const uiResults: UIResult[] = [
    ...domainResults
      .filter(r => r.type === "startup")
      .slice(0, 5)
      .map(r => ({
        key: `startup-${r.startup.id}`,
        type: "startup" as const,
        title: r.startup.name,
        subtitle: "Startup",
        startupId: r.startup.id,
      })),

    ...domainResults
      .filter(r => r.type === "industry")
      .slice(0, 3)
      .map(r => ({
        key: `industry-${r.industry}`,
        type: "industry" as const,
        title: r.industry,
      })),

    ...domainResults
      .filter(r => r.type === "job")
      .slice(0, 5)
      .map(r => ({
        key: `job-${r.jobTitle}-${r.startup.id}`,
        type: "job" as const,
        title: r.jobTitle,
        subtitle: r.startup.name,
        startupId: r.startup.id,
        isHiring: true,
      })),

    ...suggestions.slice(0, 5).map(place => ({
      key: `location-${place.id}`,
      type: "location" as const,
      title: place.label,
      place,
    })),
  ];

  const uniqueIndustries = Array.from(
    new Map(
      domainResults
        .filter(r => r.type === "industry")
        .map(r => [r.industry.toLowerCase(), r])
    ).values()
  );

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;

    async function run() {
      setIsSearching(true);

      try {
        const results = await geocodeSuggestions(debouncedQuery);
        if (cancelled) return;

        setSuggestions(results);
        setIsOpen(true);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    setActiveIndex(uiResults.length > 0 ? 0 : -1);
  }, [debouncedQuery]);

  function handlePlaceSelect(place: GeocodeSuggestion) {
    const map = globeRef.current;
    if (!map) return;

    setQuery(place.label);
    setIsOpen(false);
    setSuggestions([]);

    if (place.boundingBox) {
      map.fitBounds(
        [
          [place.boundingBox[2], place.boundingBox[0]],
          [place.boundingBox[3], place.boundingBox[1]],
        ],
        { padding: 40, duration: 1200 }
      );
    } else {
      map.flyTo({
        center: [place.lon, place.lat],
        zoom: 8,
        duration: 1200,
      });
    }
  }
  useEffect(() => {
    setHighlightedIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!searchContainerRef.current) return;

      if (!searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeIndex < 0) return;

    const el = itemRefs.current[activeIndex];
    if (!el) return;

    el.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <div className="relative w-screen h-screen">
      <div
        ref={searchContainerRef}
        className="
          absolute top-4 left-1/2 -translate-x-1/2 z-30
          w-[90%] max-w-2xl
        "
      >
        <div className="
          flex items-center gap-3
          rounded-full
          bg-background/90
          backdrop-blur-xl
          border
          px-5 py-3
          shadow-lg
        ">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (!isOpen || uiResults.length === 0) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex(i => (i + 1) % uiResults.length);
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex(i =>
                  i <= 0 ? uiResults.length - 1 : i - 1
                );
              }

              if (e.key === "Enter") {
                e.preventDefault();
                const item = uiResults[activeIndex];
                if (!item) return;

                if (item.type === "location") {
                  handlePlaceSelect(item.place);
                }

                if (item.type === "startup" || item.type === "job") {
                  setSelectedId(item.startupId);
                  setOpen(true);
                }
                
                if (item.type === "industry") {
                  const ids = Array.from(
                    new Set(
                      domainResults
                        .filter(
                          d => d.type === "industry" && d.industry === item.title
                        )
                        .map(d => d.startup.id)
                    )
                  );

                  setAppliedFilterIds(ids); 
                }
                setIsOpen(false);
              }

              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            placeholder="Search a place on the map…"
            className="flex-1 bg-transparent outline-none text-sm"
          />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
                setHighlightedIndex(-1);
                setAppliedFilterIds(null);
              }}
              className="
                text-muted-foreground
                hover:text-foreground
                transition
                px-1
              "
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

          {isSearching && (
            <div className="text-xs text-muted-foreground animate-pulse">
              Searching…
            </div>
          )}
        </div>
        {isOpen && uiResults.length > 0 && (
          <div
            className="
              absolute top-full mt-2 w-full
              rounded-2xl border
              bg-background/95 backdrop-blur-xl
              shadow-xl z-50
              overflow-hidden
            "
            style={{
              maxHeight: "min(70vh,520px)",
              overflowY: "auto",
            }}
          >
            {/* ================= STARTUPS ================= */}
            {domainResults.some(r => r.type === "startup") && (
              <SectionBlock title="Startups">
                {domainResults
                  .filter(r => r.type === "startup")
                  .slice(0, 5)
                  .map((r) => {
                    const index = uiResults.findIndex(
                      u => u.key === `startup-${r.startup.id}`
                    );

                    return (
                      <ResultItem
                        ref={(el: HTMLButtonElement | null) => {
                          itemRefs.current[index] = el;
                        }}
                        key={r.startup.id}
                        title={r.startup.name}
                        subtitle="Startup"
                        icon={<ResultIcon type="startup" />}
                        badge={r.startup.jobs.total > 0 ? "Hiring" : undefined}
                        active={index === activeIndex}
                        onClick={() => {
                          setSelectedId(r.startup.id);
                          setOpen(true);
                          setIsOpen(false);
                        }}
                      />
                    );
                  })}
              </SectionBlock>
            )}

            {/* ================= INDUSTRIES ================= */}
            <SectionBlock title="Industries">
              {uniqueIndustries.slice(0, 5).map((r) => {
                const index = uiResults.findIndex(
                  u => u.key === `industry-${r.industry}`
                );

                return (
                  <ResultItem
                    ref={(el: HTMLButtonElement | null) => {
                      itemRefs.current[index] = el;
                    }}
                    title={r.industry}
                    subtitle="Industry"
                    icon={<ResultIcon type="industry" />}
                    active={index === activeIndex}
                    onClick={() => {
                      const ids = Array.from(
                        new Set(
                          domainResults
                            .filter(d => d.type === "industry" && d.industry === r.industry)
                            .map(d => d.startup.id)
                        )
                      );

                      setAppliedFilterIds(ids);
                      setIsOpen(false);
                    }}
                  />
                );
              })}
            </SectionBlock>
            {/* ================= JOBS ================= */}
            {domainResults.some(r => r.type === "job") && (
              <SectionBlock title="Jobs">
                {domainResults
                  .filter(r => r.type === "job")
                  .slice(0, 5)
                  .map((r) => {
                    const index = uiResults.findIndex(
                      u => u.key === `job-${r.jobTitle}-${r.startup.id}`
                    );

                    return (
                      <ResultItem
                        ref={(el: HTMLButtonElement | null) => {
                          itemRefs.current[index] = el;
                        }}
                        key={`${r.jobTitle}-${r.startup.id}`}
                        title={r.jobTitle}
                        subtitle={r.startup.name}
                        icon={<ResultIcon type="job" />}
                        badge="Hiring"
                        active={index === activeIndex}
                        onClick={() => {
                          setSelectedId(r.startup.id);
                          setOpen(true);
                          setIsOpen(false);
                        }}
                      />
                    );
                  })}
              </SectionBlock>
            )}

            {/* ================= LOCATIONS ================= */}
            {suggestions.length > 0 && (
              <SectionBlock title="Locations">
                {suggestions.slice(0, 5).map((place) => {
                  const index = uiResults.findIndex(
                    u => u.key === `location-${place.id}`
                  );

                  return (
                    <ResultItem
                      ref={(el: HTMLButtonElement | null) => {
                        itemRefs.current[index] = el;
                      }}
                      key={place.id}
                      title={place.label}
                      icon={<ResultIcon type="location" />}
                      active={index === activeIndex}
                      onClick={() => {
                        handlePlaceSelect(place);
                        setIsOpen(false);
                      }}
                    />
                  );
                })}
              </SectionBlock>
            )}
          </div>
        )}
      </div>

      <Globe
        ref = {globeRef}
        startups={startups}
        activeId={selectedId}
        filteredIds={appliedFilterIds??undefined}
        onMarkerClick={(id) => {
          setSelectedId(id);
          setOpen(true);
        }}
      />

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          setIsOpen(false);
          if (!v){
            setSelectedId(null);
            setAppliedFilterIds(null);
          }    
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

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b last:border-b-0">
      <p className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

const ResultItem = forwardRef<
  HTMLButtonElement,
  {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    badge?: string;
    active: boolean;
    onClick: () => void;
  }
>(function ResultItem(
  { title, subtitle, icon, badge, active, onClick },
  ref
) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`
        w-full px-4 py-3 flex items-center gap-3 text-left
        transition
        ${active ? "bg-muted" : "hover:bg-muted"}
      `}
    >
      {icon}

      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>

      {badge && (
        <span className="
          rounded-full bg-emerald-500/10
          px-2 py-0.5 text-xs font-medium
          text-emerald-600
        ">
          {badge}
        </span>
      )}
    </button>
  );
});
function ResultIcon({
  type,
}: {
  type: "startup" | "job" | "industry" | "location";
}) {
  const className = "h-4 w-4 text-muted-foreground shrink-0";

  switch (type) {
    case "startup":
      return <Building2 className={className} />;
    case "job":
      return <Briefcase className={className} />;
    case "industry":
      return <Layers className={className} />;
    case "location":
      return <MapPin className={className} />;
  }
}

export default App;
