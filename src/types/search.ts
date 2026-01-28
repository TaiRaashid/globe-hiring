import type { GeocodeSuggestion } from "@/services/geocode";

export type UIResult =
  | {
      key: string;
      type: "startup";
      title: string;
      subtitle: string;
      startupId: string;
    }
  | {
      key: string;
      type: "industry";
      title: string;
      count: number;
    }
  | {
      key: string;
      type: "job";
      title: string;
      subtitle: string;
      startupId: string;
      isHiring: boolean;
    }
  | {
      key: string;
      type: "location";
      title: string;
      place: GeocodeSuggestion;
    };
