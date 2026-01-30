import { useEffect, useRef, useState } from "react";
import type { UIResult } from "@/types/search";
import type { GeocodeSuggestion } from "@/services/geocode";
import { SearchDropdown } from "./SearchDropdown";

type SearchBarProps = {
  query: string;
  setQuery: (v: string) => void;

  isSearching: boolean;

  isOpen: boolean;
  setIsOpen: (v: boolean) => void;

  uiResults: UIResult[];
  domainResults: any[];
  uniqueIndustries: any[];
  suggestions: GeocodeSuggestion[];

  onStartupSelect: (id: string) => void;
  onIndustrySelect: (industry: string) => void;
  onLocationSelect: (place: GeocodeSuggestion) => void;
};

export function SearchBar({
  query,
  setQuery,
  isSearching,
  isOpen,
  setIsOpen,
  uiResults,
  onStartupSelect,
  onIndustrySelect,
  onLocationSelect,
}: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigableResults = uiResults;

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(uiResults.length > 0 ? 0 : -1);
  }, [uiResults]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsOpen]);

  // Auto-scroll active item
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (!el) return;

    el.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-2xl"
    >
      <div className="flex items-center gap-3 rounded-full bg-background/90 backdrop-blur-xl border px-5 py-3 shadow-lg">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (!isOpen || uiResults.length === 0) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => i + 1 >= navigableResults.length ? 0 : i + 1);
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) =>
                i <= 0 ? navigableResults.length - 1 : i - 1
              );
            }

            if (e.key === "Enter") {
              e.preventDefault();
              const item = uiResults[activeIndex];
              if (!item) return;

              if (item.type === "startup" || item.type === "job") {
                onStartupSelect(item.startupId);
              }

              if (item.type === "industry") {
                onIndustrySelect(item.title);
              }

              if (item.type === "location") {
                onLocationSelect(item.place);
              }

              setIsOpen(false);
            }

            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder="Search startups, jobs, industries, locations…"
          className="flex-1 bg-transparent outline-none text-sm"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="text-muted-foreground hover:text-foreground transition px-1"
          >
            ✕
          </button>
        )}

        {isSearching && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Searching…
          </span>
        )}
      </div>

      <SearchDropdown
        isOpen={isOpen}
        uiResults={uiResults}
        activeIndex={activeIndex}
        itemRefs={itemRefs}
        onStartupSelect={onStartupSelect}
        onIndustrySelect={onIndustrySelect}
        onLocationSelect={onLocationSelect}
      />
    </div>
  );
}
