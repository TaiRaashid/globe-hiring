import { startups } from "@/data/startups";

/**
 * Search intents supported by the app
 */
export type SearchIntent =
  | "startup"
  | "location"
  | "industry"
  | "job"
  | "generic";

/**
 * Result returned by global search
 */
export type SearchResult = {
  intent: SearchIntent;
  startupIds: string[];
};

/**
 * Precomputed vocabularies (computed once at module load)
 */
const startupNames = new Set(
  startups.map(s => s.name.toLowerCase())
);

const industries = new Set(
  startups.flatMap(s => s.industries.map(i => i.toLowerCase()))
);

const cities = new Set(
  startups.map(s => s.location.city.toLowerCase())
);

const jobTitles = startups.flatMap(s =>
  s.jobs.positions.map(j => j.title.toLowerCase())
);

/**
 * Detect intent from free-text query
 */
function detectIntent(query: string): SearchIntent {
  const q = query.toLowerCase().trim();

  if (startupNames.has(q)) return "startup";
  if (industries.has(q)) return "industry";
  if (cities.has(q)) return "location";

  for (const job of jobTitles) {
    if (job.includes(q) || q.includes(job)) {
      return "job";
    }
  }

  return "generic";
}

/**
 * Execute global search
 */
export function executeSearch(query: string): SearchResult {
  const intent = detectIntent(query);
  const q = query.toLowerCase();

  switch (intent) {
    case "startup":
      return {
        intent,
        startupIds: startups
          .filter(s => s.name.toLowerCase() === q)
          .map(s => s.id),
      };

    case "location":
      return {
        intent,
        startupIds: startups
          .filter(s => s.location.city.toLowerCase() === q)
          .map(s => s.id),
      };

    case "industry":
      return {
        intent,
        startupIds: startups
          .filter(s =>
            s.industries.some(i => i.toLowerCase() === q)
          )
          .map(s => s.id),
      };

    case "job":
      return {
        intent,
        startupIds: startups
          .filter(s =>
            s.jobs.positions.some(j =>
              j.title.toLowerCase().includes(q)
            )
          )
          .map(s => s.id),
      };

    default:
      return {
        intent,
        startupIds: startups
          .filter(s =>
            JSON.stringify(s).toLowerCase().includes(q)
          )
          .map(s => s.id),
      };
  }
}

export type SearchSuggestion = {
  intent: SearchIntent;
  label: string;
  startupIds: string[];
};

export function getSuggestions(query: string): SearchSuggestion[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const suggestions: SearchSuggestion[] = [];

  // Startup name suggestions
  startups.forEach((s) => {
    if (s.name.toLowerCase().includes(q)) {
      suggestions.push({
        intent: "startup",
        label: s.name,
        startupIds: [s.id],
      });
    }
  });

  // City suggestions
  const cityMap = new Map<string, string[]>();
  startups.forEach((s) => {
    const city = s.location.city;
    if (city.toLowerCase().includes(q)) {
      cityMap.set(city, [...(cityMap.get(city) ?? []), s.id]);
    }
  });

  cityMap.forEach((ids, city) => {
    suggestions.push({
      intent: "location",
      label: city,
      startupIds: ids,
    });
  });

  // Industry suggestions
  const industryMap = new Map<string, string[]>();
  startups.forEach((s) => {
    s.industries.forEach((i) => {
      if (i.toLowerCase().includes(q)) {
        industryMap.set(i, [...(industryMap.get(i) ?? []), s.id]);
      }
    });
  });

  industryMap.forEach((ids, industry) => {
    suggestions.push({
      intent: "industry",
      label: industry,
      startupIds: ids,
    });
  });

  return suggestions.slice(0, 8);
}
