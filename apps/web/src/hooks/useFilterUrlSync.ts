import { useEffect, useRef } from "react";
import type { Filters } from "@/types/filters";

type Params = {
  filters: Filters;
  setFilters: (f: Filters) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

export function useFilterUrlSync({
  filters,
  setFilters,
  activeId,
  setActiveId,
}: Params) {
  const hasMounted = useRef(false);

  useEffect(() => {
    function readFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const industries = params.get("industry")?.split(",").filter(Boolean) ?? [];
      const workModeAliases: Record<string, Filters["workModes"][number]> = {
        remote: "remote",
        Remote: "remote",
        hybrid: "hybrid",
        Hybrid: "hybrid",
        on_site: "on_site",
        "On-site": "on_site",
      };
      const workModes = (params.get("workMode")?.split(",") ?? [])
        .map((mode) => workModeAliases[mode])
        .filter((mode): mode is Filters["workModes"][number] => mode !== undefined);
      setFilters({ industries, workModes });
      setActiveId(params.get("company") ?? params.get("startup"));
    }

    readFromUrl();
    window.addEventListener("popstate", readFromUrl);
    return () => window.removeEventListener("popstate", readFromUrl);
  }, [setFilters, setActiveId]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const params = new URLSearchParams();
    if (filters.industries.length) params.set("industry", filters.industries.join(","));
    if (filters.workModes.length) params.set("workMode", filters.workModes.join(","));
    if (activeId) params.set("startup", activeId);

    const query = params.toString();
    const nextUrl = query ? `?${query}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [filters, activeId]);
}
