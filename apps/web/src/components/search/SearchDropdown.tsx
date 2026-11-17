import React from "react";
import { ResultItem, ResultIcon } from "./ResultItem";
import type { GeocodeSuggestion } from "@/services/geocode";
import type { UIResult } from "@/types/search";

export function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b last:border-b-0">
      <p className="sticky top-0 z-10 bg-background/95 px-4 pt-3 pb-1 text-xs font-semibold uppercase text-muted-foreground backdrop-blur">
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
  onCompanySelect: (id: string) => void;
  onIndustrySelect: (industry: string) => void;
  onLocationSelect: (place: GeocodeSuggestion) => void;
};

export function SearchDropdown({
  isOpen,
  uiResults,
  activeIndex,
  itemRefs,
  onCompanySelect,
  onIndustrySelect,
  onLocationSelect,
}: SearchDropdownProps) {
  if (!isOpen || uiResults.length === 0) return null;

  const companies = uiResults.filter((result) => result.type === "company");
  const industries = uiResults.filter((result) => result.type === "industry");
  const locations = uiResults.filter((result) => result.type === "location");

  return (
    <div
      role="option"
      aria-label="Search Results"
      className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border bg-background/95 shadow-xl backdrop-blur-xl"
      style={{ maxHeight: "min(70vh,520px)", overflowY: "auto" }}
    >
      {companies.length > 0 && (
        <SectionBlock title="Companies">
          {companies.map((item) => {
            const index = uiResults.findIndex((result) => result.key === item.key);
            if (item.type !== "company") return null;
            return (
              <ResultItem
                key={item.key}
                ref={(element) => { itemRefs.current[index] = element; }}
                title={item.title}
                subtitle={item.subtitle}
                icon={<ResultIcon type="company" />}
                active={index === activeIndex}
                onClick={() => onCompanySelect(item.companyId)}
              />
            );
          })}
        </SectionBlock>
      )}

      {industries.length > 0 && (
        <SectionBlock title="Industries">
          {industries.map((item) => {
            const index = uiResults.findIndex((result) => result.key === item.key);
            if (item.type !== "industry") return null;
            return (
              <ResultItem
                key={item.key}
                ref={(element) => { itemRefs.current[index] = element; }}
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

      {locations.length > 0 && (
        <SectionBlock title="Locations">
          {locations.map((item) => {
            const index = uiResults.findIndex((result) => result.key === item.key);
            if (item.type !== "location") return null;
            return (
              <ResultItem
                key={item.key}
                ref={(element) => { itemRefs.current[index] = element; }}
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
