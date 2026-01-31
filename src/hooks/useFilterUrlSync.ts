import { useEffect } from "react";
import type { Filters } from "@/types/filters";

type Params = {
  filters: Filters;
  setFilters: (f: Filters) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

/**
 * Syncs Filters + active startup with URL query params
 */
export function useFilterUrlSync({
  filters,
  setFilters,
  activeId,
  setActiveId,
}: Params) {
  /**
   * 1️⃣ Read from URL → state (on first load + back/forward)
   */
  useEffect(() => {
    function readFromUrl() {
      const params = new URLSearchParams(window.location.search);

      const industries = params.get("industry")?.split(",").filter(Boolean) ?? [];
      const workModes =
        (params.get("workMode")?.split(",") as Filters["workModes"]) ?? [];

      const hiringOnly = params.get("hiring") === "true";
      const startup = params.get("startup");

      setFilters({
        industries,
        workModes,
        hiringOnly,
      });

      setActiveId(startup ?? null);
    }

    readFromUrl();
    window.addEventListener("popstate", readFromUrl);

    return () => {
      window.removeEventListener("popstate", readFromUrl);
    };
  }, [setFilters, setActiveId]);

  /**
   * 2️⃣ State → URL (whenever filters / startup change)
   */
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.industries.length) {
      params.set("industry", filters.industries.join(","));
    }

    if (filters.workModes.length) {
      params.set("workMode", filters.workModes.join(","));
    }

    if (filters.hiringOnly) {
      params.set("hiring", "true");
    }

    if (activeId) {
      params.set("startup", activeId);
    }

    const newUrl =
      params.toString().length > 0
        ? `?${params.toString()}`
        : window.location.pathname;

    window.history.replaceState(null, "", newUrl);
  }, [filters, activeId]);
}
