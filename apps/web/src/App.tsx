import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "@/components/map";
import { geocodeSuggestions, type GeocodeSuggestion } from "@/services/geocode";
import { useDebounce } from "@/hooks/useDebounce";
import { buildSearchIndex, searchIndex } from "@/services/searchIndex";
import { SearchBar } from "./components/search/SearchBar";
import type { UIResult } from "./types/search";
import type { Filters } from "@/types/filters";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Suggestions } from "./components/discovery/Suggestions";
import { ComparePanel } from "@/components/compare/ComparePanel";
import { useCompanies } from "@/hooks/useCompanies";
import { formatWorkMode } from "@/types/company";

const Globe = lazy(() => import("./Globe"));

function App() {
  const { companies, loading, error, retry } = useCompanies();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = companies.find((company) => company.id === selectedId);
  const globeRef = useRef<MapRef | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchIndexData = useMemo(() => buildSearchIndex(companies), [companies]);
  const domainResults = searchIndex(searchIndexData, debouncedQuery);
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchSwipe = useSwipeDown(() => setMobileSearchOpen(false));
  const filterSwipe = useSwipeDown(() => setFiltersOpen(false));
  const detailSwipe = useSwipeDown(() => setOpen(false));
  const recent = useRecentStartups();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    industries: [],
    workModes: [],
  });

  useFilterUrlSync({
    filters,
    setFilters,
    activeId: selectedId,
    setActiveId: setSelectedId,
  });

  const availableIndustries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const company of companies) {
      for (const industry of company.industries) {
        counts.set(industry, (counts.get(industry) ?? 0) + 1);
      }
    }
    return Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [companies]);

  const industryMap = new Map<string, Set<string>>();
  for (const result of domainResults) {
    if (result.type !== "industry") continue;
    const key = result.industry.toLowerCase();
    if (!industryMap.has(key)) industryMap.set(key, new Set());
    industryMap.get(key)!.add(result.company.id);
  }

  const uniqueIndustries = Array.from(industryMap.entries()).map(
    ([industry, companySet]) => ({ industry, count: companySet.size }),
  );

  const uiResults: UIResult[] = [
    ...domainResults
      .filter((result) => result.type === "company")
      .slice(0, 5)
      .map((result) => ({
        key: `company-${result.company.id}`,
        type: "company" as const,
        title: result.company.name,
        subtitle: result.company.location
          ? `${result.company.location.city}, ${result.company.location.country}`
          : "Company",
        companyId: result.company.id,
      })),
    ...uniqueIndustries.slice(0, 3).map((result) => ({
      key: `industry-${result.industry}`,
      type: "industry" as const,
      title: result.industry,
      count: result.count,
    })),
    ...suggestions.slice(0, 5).map((place) => ({
      key: `location-${place.id}`,
      type: "location" as const,
      title: place.label,
      place,
    })),
  ];

  function toggleCompare(id: string) {
    setCompareIds((previous) => {
      if (previous.includes(id)) return previous.filter((item) => item !== id);
      if (previous.length >= 3) return previous;
      return [...previous, id];
    });
  }

  function removeCompare(id: string) {
    setCompareIds((previous) => previous.filter((item) => item !== id));
  }

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    let cancelled = false;

    async function run() {
      setIsSearching(true);
      try {
        const results = await geocodeSuggestions(debouncedQuery);
        if (cancelled) return;
        setSuggestions(results);
        setIsOpen(true);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function handlePlaceSelect(place: GeocodeSuggestion) {
    const map = globeRef.current;
    if (!map) return;

    handleQueryChange(place.label);
    setIsOpen(false);
    setSuggestions([]);

    if (place.boundingBox) {
      map.fitBounds(
        [
          [place.boundingBox[2], place.boundingBox[0]],
          [place.boundingBox[3], place.boundingBox[1]],
        ],
        { padding: 40, duration: 1200 },
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
    if (mobileSearchOpen || filtersOpen || open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSearchOpen, filtersOpen, open]);

  const handleCompanySelect = (id: string) => {
    setSelectedId(id);
    setOpen(true);
    recent.add(id);
  };

  const compareCompanies = compareIds
    .map((id) => companies.find((company) => company.id === id))
    .filter((company): company is (typeof companies)[number] => company !== undefined);

  return (
    <div className="relative h-screen w-screen">
      {isMobile ? (
        <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 left-1/2 z-30 -translate-x-1/2"
            >
              Search
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="h-full" {...searchSwipe}>
            <SheetHeader><SheetTitle>Search</SheetTitle></SheetHeader>
            <div className="px-4">
              <SearchBar
                variant="mobile"
                query={query}
                setQuery={handleQueryChange}
                isSearching={isSearching}
                isOpen
                setIsOpen={() => {}}
                uiResults={uiResults}
                suggestions={suggestions}
                onCompanySelect={(id) => {
                  handleCompanySelect(id);
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
          setQuery={handleQueryChange}
          isSearching={isSearching}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          uiResults={uiResults}
          suggestions={suggestions}
          onCompanySelect={handleCompanySelect}
          onIndustrySelect={(industry) =>
            setFilters({ ...filters, industries: [industry] })
          }
          onLocationSelect={handlePlaceSelect}
        />
      )}

      <ExplorePresets filters={filters} setFilters={setFilters} />

      {isMobile ? (
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2"
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
          if (key === "industries") {
            setFilters({
              ...filters,
              industries: filters.industries.filter((item) => item !== value),
            });
          } else {
            setFilters({
              ...filters,
              workModes: filters.workModes.filter((mode) => mode !== value),
            });
          }
        }}
      />

      {compareIds.length >= 2 && (
        <Button
          size="sm"
          className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 shadow-lg"
          onClick={() => setCompareOpen(true)}
        >
          Compare ({compareIds.length})
        </Button>
      )}

      <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader><SheetTitle>Company comparison</SheetTitle></SheetHeader>
          <ComparePanel companies={compareCompanies} onRemove={removeCompare} />
        </SheetContent>
      </Sheet>

      <Suspense
        fallback={
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Loading interactive globe…
          </div>
        }
      >
        <Globe
          ref={globeRef}
          companies={companies}
          activeId={selectedId}
          filters={filters}
          onMarkerClick={handleCompanySelect}
        />
      </Suspense>

      {loading && (
        <div className="absolute bottom-4 right-4 z-30 rounded-lg border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow">
          Loading company data…
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 right-4 z-40 max-w-sm rounded-xl border bg-background/95 p-4 shadow-xl">
          <p className="text-sm font-medium">Could not load company data</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Button size="sm" className="mt-3" onClick={retry}>Try again</Button>
        </div>
      )}

      {!loading && !error && companies.length === 0 && (
        <div className="absolute bottom-4 right-4 z-30 rounded-lg border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow">
          No companies are available yet.
        </div>
      )}

      <Sheet
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          setIsOpen(false);
          if (!value) setSelectedId(null);
        }}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`${
            isMobile ? "h-[85vh]" : "w-105 sm:w-120"
          } overflow-y-auto border-l bg-background/95 px-6 py-6 shadow-2xl backdrop-blur-xl`}
          {...(isMobile ? detailSwipe : {})}
        >
          {selected && (
            <>
              <SheetHeader className="flex items-center justify-between gap-3 border-b pb-6">
                <SheetTitle className="text-2xl tracking-tight">
                  {selected.name}
                </SheetTitle>
                <Button
                  size="sm"
                  variant={compareIds.includes(selected.id) ? "secondary" : "outline"}
                  onClick={() => toggleCompare(selected.id)}
                >
                  {compareIds.includes(selected.id) ? "Added" : "Compare"}
                </Button>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.industries.map((industry) => (
                    <span
                      key={industry}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </SheetHeader>

              <Separator />

              <div className="mt-8 space-y-10 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <MetaCard label="Founded" value={selected.foundedYear ?? "Not available"} />
                  <MetaCard label="Work mode" value={formatWorkMode(selected.workMode)} />
                  <MetaCard label="Team size" value={selected.teamSizeLabel ?? "Not available"} />
                  <MetaCard
                    label="Location"
                    value={
                      selected.location
                        ? `${selected.location.city}, ${selected.location.country}`
                        : "Not available"
                    }
                  />
                </div>

                <Section title="About">
                  <p className="leading-relaxed text-muted-foreground">
                    {selected.description || "No company description is available yet."}
                  </p>
                </Section>

                <Separator />

                <Section title="Funding">
                  <Info label="Stage" value={selected.fundingStage ?? "Not disclosed"} />
                  <Info
                    label="Total funding"
                    value={
                      selected.fundingTotal > 0
                        ? `$${(selected.fundingTotal / 1_000_000).toFixed(0)}M`
                        : "Not disclosed"
                    }
                  />
                </Section>

                <p className="text-xs text-muted-foreground">
                  Profile status: {selected.verificationStatus}
                </p>

                <Suggestions
                  companies={companies}
                  currentId={selected.id}
                  onSelect={setSelectedId}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <RecentPanel
        companies={companies}
        ids={recent.recent}
        onSelect={(id) => {
          setSelectedId(id);
          setOpen(true);
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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

function MetaCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="grid grid-cols-2 gap-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-medium">{value}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default App;
