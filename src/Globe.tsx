import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import { companies } from "./data/locations";

type GlobeProps = {
  onMarkerClick?: (id: string) => void;
};

export default function Globe({ onMarkerClick }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerClickRef = useRef<((id: string) => void) | undefined>(onMarkerClick);
  markerClickRef.current = onMarkerClick;

  const companyGeoJson = {
    type: "FeatureCollection",
    features: companies.map((c) => ({
      type: "Feature",
      properties: {
        id: c.id,
        name: c.name
      },
      geometry: {
        type: "Point",
        coordinates: [c.lng, c.lat]
      }
    }))
  } as GeoJSON.FeatureCollection;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [72.95, 21.69],
      zoom: 4,
      minZoom: 1.2,
      maxZoom: 16,
      pitch: 0,
      bearing: 0
    });

    mapRef.current = map;
    console.log("Companies loaded:", companies);

    map.on("style.load", () => {
      map.setProjection({ type: "globe" });
    });

    map.on("load", () => {
      map.addSource("companies", {
        type: "geojson",
        data: companyGeoJson
      });

      map.addLayer({
        id: "company-points",
        type: "circle",
        source: "companies",
        paint: {
          "circle-radius": 6,
          "circle-color": "#0f172a",
          "circle-stroke-width": 3,
          "circle-stroke-color": "rgba(15,23,42,0.25)"
        }
      });

      map.on("click", "company-points", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const id = feature.properties?.id as string;
        console.log("Clicked company:", feature.properties?.name);
        onMarkerClick?.(id);
      });

      map.on("mouseenter", "company-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "company-points", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    map.on("click", "company-points", (e) => {
      const feature = e.features?.[0];
      if (!feature) return;

      const id = feature.properties?.id as string;
      markerClickRef.current?.(id);
    });


    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", pointerEvents:"auto"}}
    />
  );
}
