import type { Company } from "@/types/company";

export type SearchResult =
  | { type: "company"; company: Company }
  | { type: "industry"; company: Company; industry: string };

export function buildSearchIndex(companies: Company[]) {
  return companies.map((company) => ({
    company,
    name: company.name.toLowerCase(),
    industries: company.industries.map((industry) => industry.toLowerCase()),
    city: company.location?.city.toLowerCase() ?? "",
    country: company.location?.country.toLowerCase() ?? "",
  }));
}

export function searchIndex(
  index: ReturnType<typeof buildSearchIndex>,
  query: string,
): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const scored: { result: SearchResult; score: number }[] = [];

  for (const item of index) {
    if (item.name.includes(q)) {
      scored.push({ result: { type: "company", company: item.company }, score: 100 });
    }

    for (const industry of item.industries) {
      if (industry.includes(q)) {
        scored.push({
          result: {
            type: "industry",
            company: item.company,
            industry,
          },
          score: 40,
        });
        break;
      }
    }

    if (item.city.includes(q) || item.country.includes(q)) {
      scored.push({ result: { type: "company", company: item.company }, score: 30 });
    }
  }

  const unique = new Map<string, { result: SearchResult; score: number }>();
  for (const item of scored) {
    const key = item.result.type === "company"
      ? `company:${item.result.company.id}`
      : `industry:${item.result.industry}:${item.result.company.id}`;
    const previous = unique.get(key);
    if (!previous || item.score > previous.score) unique.set(key, item);
  }

  return [...unique.values()]
    .sort((a, b) => b.score - a.score)
    .map((item) => item.result);
}
