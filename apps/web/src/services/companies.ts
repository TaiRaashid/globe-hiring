import type { Company } from "@/types/company";

type CompanyPage = {
  data: Company[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

async function fetchCompanyPage(offset: number, signal?: AbortSignal): Promise<CompanyPage> {
  const response = await fetch(
    `${API_URL}/api/companies?limit=100&offset=${offset}`,
    { signal, headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(`Company API returned HTTP ${response.status}`);
  }

  return response.json() as Promise<CompanyPage>;
}

export async function fetchCompanies(signal?: AbortSignal): Promise<Company[]> {
  const companies: Company[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchCompanyPage(offset, signal);
    companies.push(...page.data);

    if (!page.pagination.hasMore) break;
    if (page.data.length === 0) {
      throw new Error("Company API returned an empty page while more results were expected.");
    }

    offset += page.pagination.limit;
  }

  return companies;
}
