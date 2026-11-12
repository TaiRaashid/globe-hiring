import React from "react";
import { ResultItem, ResultIcon } from "./ResultItem";
import type { GeocodeSuggestion } from "@/services/geocode";
import type { UIResult } from "@/types/search";

/* SectionBlock */
export function SectionBlock({
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

type SearchDropdownProps = {
  isOpen: boolean;
  uiResults: UIResult[];
  activeIndex: number;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;

  onStartupSelect: (id: string) => void;
  onIndustrySelect: (industry: string) => void;
  onLocationSelect: (place: GeocodeSuggestion) => void;
};

export function SearchDropdown({
  isOpen,
  uiResults,
  activeIndex,
  itemRefs,
  onStartupSelect,
  onIndustrySelect,
  onLocationSelect,
}: SearchDropdownProps) {
  if (!isOpen || uiResults.length === 0) return null;

  const startups = uiResults.filter((r) => r.type === "startup");
  const industries = uiResults.filter((r) => r.type === "industry");
  const jobs = uiResults.filter((r) => r.type === "job");
  const locations = uiResults.filter((r) => r.type === "location");
  
  return (
    <div
      role="option"
      aria-label="Search Results"
      className="
        absolute top-full mt-2 w-full
        rounded-2xl border
        bg-background/95 backdrop-blur-xl
        shadow-xl z-50
        overflow-hidden
      "
      style={{ maxHeight: "min(70vh,520px)", overflowY: "auto" }}
    >
      {/* ================= STARTUPS ================= */}
      {startups.length > 0 && (
        <SectionBlock title="Startups">
          {startups.map((item) => {
            const index = uiResults.findIndex((u) => u.key === item.key);

            return (
              <ResultItem
                key={item.key}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                title={item.title}
                subtitle={item.subtitle}
                icon={<ResultIcon type="startup" />}
                active={index === activeIndex}
                onClick={() => onStartupSelect(item.startupId)}
              />
            );
          })}
        </SectionBlock>
      )}

      {/* ================= INDUSTRIES ================= */}
      {industries.length > 0 && (
        <SectionBlock title="Industries">
          {industries.map((item) => {
            const index = uiResults.indexOf(item);
            if (index === -1) return null;
            return (
              <ResultItem
                key={item.key}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                title={item.title}
                subtitle="Industry"
                icon={<ResultIcon type="industry" />}
                badge={`${item.count}`}
                active={index === activeIndex}
                onClick={() => onIndustrySelect(item.title)}
              />
            );
          })}
        </SectionBlock>
      )}

      {/* ================= JOBS ================= */}
      {jobs.length > 0 && (
        <SectionBlock title="Jobs">
          {jobs.map((item) => {
            const index = uiResults.findIndex((u) => u.key === item.key);

            return (
              <ResultItem
                key={item.key}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                title={item.title}
                subtitle={item.subtitle}
                icon={<ResultIcon type="job" />}
                badge="Hiring"
                active={index === activeIndex}
                onClick={() => onStartupSelect(item.startupId)}
              />
            );
          })}
        </SectionBlock>
      )}

      {/* ================= LOCATIONS ================= */}
      {locations.length > 0 && (
        <SectionBlock title="Locations">
          {locations.map((item) => {
            const index = uiResults.findIndex((u) => u.key === item.key);

            return (
              <ResultItem
                key={item.key}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                title={item.title}
                icon={<ResultIcon type="location" />}
                active={index === activeIndex}
                onClick={() => onLocationSelect(item.place)}
              />
            );
          })}
        </SectionBlock>
      )}
    </div>
  );
}
