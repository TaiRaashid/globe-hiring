import Globe from "./Globe";
import { startups } from "@/data/startups";
import { useEffect, useRef, useState } from "react";
import type { MapRef } from "@/components/map";
import { geocodeSuggestions, type GeocodeSuggestion } from "@/services/geocode";
import { useDebounce } from "@/hooks/useDebounce";
import { buildSearchIndex, searchIndex } from "@/services/searchIndex";
import { SearchBar } from "./components/search/SearchBar";
import { type UIResult } from "./types/search";
import { type Filters } from "@/types/filters";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { ActiveFilters } from "@/components/filters/ActiveFilters";
import { useFilterUrlSync } from "@/hooks/useFilterUrlSync";
import { useIsMobile } from "./hooks/useIsMobile";
import { Button } from "./components/ui/button";
import { useSwipeDown } from "@/hooks/useSwipeDown";
import { ExplorePresets } from "@/components/discovery/ExplorePresets";
import { useRecentStartups } from "@/hooks/useRecentStartups";
import { RecentPanel } from "@/components/discovery/RecentPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Suggestions } from "./components/discovery/Suggestions";

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
  const searchIndexRef = useRef(buildSearchIndex(startups));
  const domainResults = searchIndex(searchIndexRef.current, debouncedQuery);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchSwipe = useSwipeDown(() => setMobileSearchOpen(false));
  const filterSwipe = useSwipeDown(() => setFiltersOpen(false));
  const detailSwipe = useSwipeDown(() => setOpen(false));
  const recent = useRecentStartups();
  const [filters, setFilters] = useState<Filters>({
    industries: [],
    workModes: [],
    hiringOnly: false,
  });
  
  useFilterUrlSync({
    filters,
    setFilters,
    activeId: selectedId,
    setActiveId: setSelectedId,
  });

  const availableIndustries = Array.from(
    startups.reduce((map, s) => {
      s.industries.forEach((i) => {
        map.set(i, (map.get(i) ?? 0) + 1);
      });
      return map;
    }, new Map<string, number>())
  ).map(([name, count]) => ({ name, count }));

  const industryMap = new Map<string, Set<string>>();

  for (const r of domainResults) {
    if (r.type !== "industry") continue;

    const key = r.industry.toLowerCase();

    if (!industryMap.has(key)) {
      industryMap.set(key, new Set());
    }

    industryMap.get(key)!.add(r.startup.id);
  }

  const uniqueIndustries = Array.from(industryMap.entries()).map(
      ([industry,startupSet]) => ({
        industry,
        count: startupSet.size,
      })
  );

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

    ...uniqueIndustries
      .slice(0, 3)
      .map(r => ({
        key: `industry-${r.industry.toLowerCase()}`,
        type: "industry" as const,
        title: r.industry,
        count: r.count,
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

  useEffect(() => {
    if (mobileSearchOpen || filtersOpen || open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileSearchOpen, filtersOpen, open]);

  return (
    <div className="relative w-screen h-screen">
      {/* Search */}
      {isMobile ? (
        <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
            >
              Search
            </Button>
          </SheetTrigger>

          <SheetContent side="top" className="h-full" {...searchSwipe}>
            <SheetHeader>
              <SheetTitle>Search</SheetTitle>
            </SheetHeader>
            <div className="px-4">
              <SearchBar
                variant="mobile"
                query={query}
                setQuery={setQuery}
                isSearching={isSearching}
                isOpen={true}
                setIsOpen={() => {}}
                uiResults={uiResults}
                domainResults={domainResults}
                uniqueIndustries={uniqueIndustries}
                suggestions={suggestions}
                onStartupSelect={(id) => {
                  setSelectedId(id);
                  setOpen(true);
                  recent.add(id);
                  setMobileSearchOpen(false);
                }}
                onIndustrySelect={(industry) => {
                  setFilters({ ...filters, industries: [industry] });
                  setMobileSearchOpen(false);
                }}
                onLocationSelect={handlePlaceSelect}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <SearchBar
          variant="desktop"
          query={query}
          setQuery={setQuery}
          isSearching={isSearching}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          uiResults={uiResults}
          domainResults={domainResults}
          uniqueIndustries={uniqueIndustries}
          suggestions={suggestions}
          onStartupSelect={(id) => {
            setSelectedId(id);
            setOpen(true);
            recent.add(id);
          }}
          onIndustrySelect={(industry) =>
            setFilters({ ...filters, industries: [industry] })
          }
          onLocationSelect={handlePlaceSelect}
        />
      )}

      <ExplorePresets filters={filters} setFilters={setFilters} />
      
      {/* Filters */}
        {isMobile ? (
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                size="sm"
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30"
              >
                Filters
              </Button>
            </SheetTrigger>

            <SheetContent side="bottom" className="h-[85vh]" {...filterSwipe}>
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                availableIndustries={availableIndustries}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            availableIndustries={availableIndustries}
          />
        )}

      <ActiveFilters
        filters={filters}
        onRemove={(key, value) => {
          if (key === "hiringOnly") {
            setFilters({ ...filters, hiringOnly: false });
            return;
          }

          setFilters({
            ...filters,
            [key]: filters[key].filter((v: string) => v !== value),
          });
        }}
      />

      <Globe
        ref = {globeRef}
        startups={startups}
        activeId={selectedId}
        filters={filters}
        onMarkerClick={(id: string) => {
          setSelectedId(id);
          setOpen(true);
          recent.add(id);
        }}
      />

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          setIsOpen(false);
          if (!v){
            setSelectedId(null);
          }    
        }}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`${
            isMobile
              ? "h-[85vh]"
              : "w-105 sm:w-120"
          } overflow-y-auto bg-background/95 backdrop-blur-xl border-l shadow-2xl px-6 py-6`}
          {...(isMobile ? detailSwipe : {})}
        >
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

                  <Suggestions
                    currentId={selected.id}
                    onSelect={(id) => {
                      setSelectedId(id);
                    }}
                  />

                </div>
              </>
            )}
          </SheetContent>

      </Sheet>

      <RecentPanel
        ids={recent.recent}
        onSelect={(id) => {
          setSelectedId(id);
          setOpen(true);
        }}
      />

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
