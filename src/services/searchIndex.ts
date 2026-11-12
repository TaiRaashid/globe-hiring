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

  const scored: { result: SearchResult; score: number }[] = [];

  for (const item of index) {
    // startup name
    if (item.name.includes(q)) {
      scored.push({
        result: { type: "startup", startup: item.startup },
        score: 100 + (item.hiring ? 20 : 0),
      });
    }

    // jobs
    for (const job of item.jobs) {
      if (job.includes(q)) {
        scored.push({
          result: {
            type: "job",
            startup: item.startup,
            jobTitle: job,
          },
          score: 60 + (item.hiring ? 20 : 0),
        });
        break;
      }
    }

    // industry
    for (const ind of item.industries) {
      if (ind.includes(q)) {
        scored.push({
          result: {
            type: "industry",
            startup: item.startup,
            industry: ind,
          },
          score: 40,
        });
        break;
      }
    }

    // city
    if (item.city.includes(q)) {
      scored.push({
        result: { type: "startup", startup: item.startup },
        score: 30,
      });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.result);
}
