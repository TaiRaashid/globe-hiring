import type { Startup } from "@/types/startup";

export type SearchResult =
  | { type: "startup"; startup: Startup }
  | { type: "job"; startup: Startup; jobTitle: string }
  | { type: "industry"; startup: Startup; industry: string };

export function buildSearchIndex(startups: Startup[]) {
  return startups.map((s) => ({
    startup: s,
    name: s.name.toLowerCase(),
    industries: s.industries.map((i) => i.toLowerCase()),
    jobs: s.jobs.positions.map((j) => j.title.toLowerCase()),
    city: s.location.city.toLowerCase(),
    hiring: s.jobs.total > 0,
  }));
}

export function searchIndex(
  index: ReturnType<typeof buildSearchIndex>,
  query: string
): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  for (const item of index) {
    if (item.name.includes(q)) {
      results.push({ type: "startup", startup: item.startup });
      continue;
    }

    for (const job of item.jobs) {
      if (job.includes(q)) {
        results.push({
          type: "job",
          startup: item.startup,
          jobTitle: job,
        });
        break;
      }
    }

    for (const ind of item.industries) {
      if (ind.includes(q)) {
        results.push({
          type: "industry",
          startup: item.startup,
          industry: ind,
        });
        break;
      }
    }
  }

  return results;
}
