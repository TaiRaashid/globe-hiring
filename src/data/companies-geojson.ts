import type { FeatureCollection, Point } from "geojson";
import { companies } from "./locations";

export const companiesGeoJson: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: companies.map((c) => ({
    type: "Feature",
    properties: {
      id: c.id,
      name: c.name,
    },
    geometry: {
      type: "Point",
      coordinates: [c.lng, c.lat],
    },
  })),
};
