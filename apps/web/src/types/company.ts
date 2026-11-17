export type WorkMode = "remote" | "hybrid" | "on_site";

export interface Company {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string;
  foundedYear: number | null;
  workMode: WorkMode | null;
  teamSizeLabel: string | null;
  fundingStage: string | null;
  fundingTotal: number;
  verificationStatus: "unverified" | "verified" | "rejected";
  location: {
    city: string;
    region: string | null;
    country: string;
    latitude: number;
    longitude: number;
  } | null;
  industries: string[];
}

export function formatWorkMode(mode: WorkMode | null): string {
  if (!mode) return "Not specified";
  if (mode === "on_site") return "On-site";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}
