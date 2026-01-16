import { useEffect, useRef } from "react";
import { companies } from "./data/locations";
import { companiesGeoJson } from "./data/companies-geojson";
import type { MapRef } from "@/components/map";
import {
  Map,
  MapClusterLayer,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
} from "@/components/map";

type GlobeProps = {
  activeId: string|null;
  onMarkerClick?: (id: string) => void;
};
function computeBearing(fromLng: number, toLng: number) {
  let delta = toLng - fromLng;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return -delta;
}

export default function Globe({ activeId,onMarkerClick }: GlobeProps) {
  const mapRef = useRef<MapRef | null>(null);
  useEffect(() => {
    if (!activeId || !mapRef.current) return;

    const company = companies.find((c) => c.id === activeId);
    if (!company) return;

    const map = mapRef.current;
    const currentCenter = map.getCenter();
    const targetbearing = computeBearing(
      currentCenter.lng,
      company.lat
    );
    map.flyTo({
      center: [company.lng, company.lat],
      zoom: 6,
      bearing: targetbearing,
      pitch:0,
      duration: 1500,
      easing: (t)=>t*(2-t),
      essential: true,
    });
  }, [activeId]);

  return (
    <Map
      ref = {mapRef}
      projection={{ type: "globe" }}
      center={[72.95, 21.69]}
      zoom={8}
      minZoom={1.2}
      maxZoom={16}
      renderWorldCopies={false}
      attributionControl={{ compact: true }}
    >
      <MapClusterLayer 
        data={companiesGeoJson}
        clusterMaxZoom={6}
        clusterRadius={50}
        pointColor="#10b981"
        onPointClick={(feature) => {
          const id = feature.properties?.id as string;
          onMarkerClick?.(id);
        }}
      />
      {companies.map((company) => {
        const isActive = company.id === activeId;
        return (
          <MapMarker
            key={company.id}
            longitude={company.lng}
            latitude={company.lat}
            onClick={() => {
              onMarkerClick?.(company.id)
            }}
          >
            <MarkerContent>
              <div className="relative">
                {isActive && (
                  <span className="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping" />
                )}
                <div
                  className={[
                    "rounded-full transition-all duration-200",
                    isActive
                      ? "h-4 w-4 bg-green-600 ring-4 ring-green-600/40"
                      : "h-3 w-3 bg-teal-700 ring-4 ring-slate-900/25",
                  ].join(" ")}
                />
              </div>
            </MarkerContent>
            <MarkerTooltip>{company.name}</MarkerTooltip>
          </MapMarker>
        );
      })}
    </Map>
  );
}
