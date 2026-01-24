export type GeocodeSuggestion = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  boundingBox?: [number, number, number, number];
};

export async function geocodeSuggestions(
  query: string
): Promise<GeocodeSuggestion[]> {
  if (!query.trim()) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "globehiring/1.0",
    },
  });

  if (!res.ok) return [];

  const data = await res.json();

  return data.map((item: any) => ({
    id: item.place_id,
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
}
