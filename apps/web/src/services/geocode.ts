export type GeocodeSuggestion = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  boundingBox?: [number, number, number, number];
};

type NominatimResult = {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
};

function isNominatimResult(value: unknown): value is NominatimResult {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;
  return (
    (typeof item.place_id === "number" || typeof item.place_id === "string") &&
    typeof item.display_name === "string" &&
    typeof item.lat === "string" &&
    typeof item.lon === "string" &&
    (item.boundingbox === undefined ||
      (Array.isArray(item.boundingbox) &&
        item.boundingbox.length === 4 &&
        item.boundingbox.every((coordinate) => typeof coordinate === "string")))
  );
}

export async function geocodeSuggestions(
  query: string
): Promise<GeocodeSuggestion[]> {
  if (!query.trim()) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");

  try {
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "globehiring/1.0" },
    });

    if (!response.ok) return [];

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) return [];

    return payload.filter(isNominatimResult).map((item) => ({
      id: String(item.place_id),
      label: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
      boundingBox: item.boundingbox
        ? [
            Number(item.boundingbox[0]),
            Number(item.boundingbox[1]),
            Number(item.boundingbox[2]),
            Number(item.boundingbox[3]),
          ]
        : undefined,
    }));
  } catch {
    return [];
  }
}
