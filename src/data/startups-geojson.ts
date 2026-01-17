import type { FeatureCollection, Point } from "geojson";
import { startups } from "./startups";

export const startupsGeoJson: FeatureCollection<Point, { id: string }> = {
  type: "FeatureCollection",
  features: startups.map((s) => ({
    type: "Feature",
    properties: {
      id: s.id,
    },
    geometry: {
      type: "Point",
      coordinates: [s.location.lng, s.location.lat],
    },
  })),
};
