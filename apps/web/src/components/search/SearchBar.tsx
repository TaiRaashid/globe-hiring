import { useEffect, useRef, useState } from "react";
import type { UIResult } from "@/types/search";
import type { GeocodeSuggestion } from "@/services/geocode";
import { SearchDropdown } from "./SearchDropdown";

type SearchBarProps = {
  variant?: "desktop" | "mobile";
  query: string;
  setQuery: (v: string) => void;
  isSearching: boolean;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  uiResults: UIResult[];
  suggestions: GeocodeSuggestion[];
  onCompanySelect: (id: string) => void;
  onIndustrySelect: (industry: string) => void;
  onLocationSelect: (place: GeocodeSuggestion) => void;
};


export function SearchBar({
  variant = "desktop",
  query,
  setQuery,
  isSearching,
  isOpen,
  setIsOpen,
  uiResults,
  onCompanySelect,
  onIndustrySelect,
  onLocationSelect,
}: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigableResults = uiResults;
  const currentActiveIndex = uiResults.length === 0
    ? -1
    : Math.min(Math.max(activeIndex, 0), uiResults.length - 1);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    const el = itemRefs.current[currentActiveIndex];
    if (!el) return;

    el.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [currentActiveIndex]);

  useEffect(() => {
    if (variant === "mobile") {
      // Small timeout helps on iOS Safari
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [variant]);

  return (
    <div
      ref={containerRef}
      className={
        variant === "desktop"
          ? "absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-2xl"
          : "relative w-full"
      }
    >
      <div
        className={
          variant === "mobile"
            ? "sticky top-0 z-10 bg-background pb-2"
            : ""
        }
      >
        <div 
          className={
            variant === "desktop"
              ? "flex items-center gap-3 rounded-full bg-background/90 backdrop-blur-xl border px-5 py-3 shadow-lg"
              : "flex items-center gap-3 rounded-xl bg-background border px-4 py-3"
          }
        >
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setActiveIndex(0);
              setQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (!isOpen || uiResults.length === 0) return;

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIsOpen(true);
                setActiveIndex(
                  currentActiveIndex + 1 >= navigableResults.length
                    ? 0
                    : currentActiveIndex + 1
                );
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex(
                  currentActiveIndex <= 0
                    ? navigableResults.length - 1
                    : currentActiveIndex - 1
                );
              }

              if (e.key === "Enter") {
                e.preventDefault();
                const item = uiResults[currentActiveIndex];
                if (!item) return;

                if (item.type === "company") {
                  onCompanySelect(item.companyId);
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
            placeholder="Search companies, industries, locations…"
            className="flex-1 bg-transparent outline-none text-sm"
          />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
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
    </div>

      <SearchDropdown
        isOpen={isOpen}
        uiResults={uiResults}
        activeIndex={currentActiveIndex}
        itemRefs={itemRefs}
        onCompanySelect={onCompanySelect}
        onIndustrySelect={onIndustrySelect}
        onLocationSelect={onLocationSelect}
      />
    </div>
  );
}
