import type { GeocodeSuggestion } from "@/services/geocode";

export type UIResult =
  | {
      key: string;
      type: "company";
      title: string;
      subtitle: string;
      companyId: string;
    }
  | {
      key: string;
      type: "industry";
      title: string;
      count: number;
    }
  | {
      key: string;
      type: "location";
      title: string;
      place: GeocodeSuggestion;
    };
