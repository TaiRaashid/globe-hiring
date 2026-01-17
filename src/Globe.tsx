import { useEffect, useRef } from "react";
import { startupsGeoJson } from "@/data/startups-geojson";
import type { MapRef } from "@/components/map";
import type { Startup } from "./types/startup";
import {
  Map,
  MapClusterLayer,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
} from "@/components/map";

type GlobeProps = {
  startups: Startup[];
  activeId: string | null;
  onMarkerClick?: (id: string) => void;
};

export default function Globe({ activeId, onMarkerClick, startups }: GlobeProps) {
  const mapRef = useRef<MapRef | null>(null);

  useEffect(() => {
    if (!activeId || !mapRef.current) return;

    const company = startups.find((s) => s.id === activeId);
    if (!company) return;

    mapRef.current.flyTo({
      center: [company.location.lng, company.location.lat],
      zoom: 20,
      bearing: 0,
      pitch: 0,
      duration: 1200,
      essential: true,
    });
  }, [activeId]);

  return (
    <Map
      ref={mapRef}
      projection={{ type: "globe" }}
      center={[72.95, 21.69]}
      zoom={8}
      minZoom={1.2}
      maxZoom={16}
      renderWorldCopies={false}
    >
      <MapClusterLayer
        data={startupsGeoJson}
        clusterMaxZoom={7}
        clusterRadius={10}
        clusterColors={[
          "#14b8a6",
          "#2563eb",
          "#7c3aed",
        ]}
        clusterThresholds={[20,100]}
        onPointClick={(feature) => {
          const id = feature.properties?.id as string;
          onMarkerClick?.(id);
        }}
      />

      {startups.map((company) => {
        const isActive = company.id === activeId;

        return (
          <MapMarker
            key={company.id}
            longitude={company.location.lng}
            latitude={company.location.lat}
            onClick={() => onMarkerClick?.(company.id)}
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
            <MarkerTooltip>
              <div className="min-w-45 space-y-1">
                <p className="text-sm font-semibold">{company.name}</p>

                <p className="text-xs text-muted-foreground">
                  {company.industries.join(", ")}
                </p>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{company.work_mode}</span>
                  <span>
                    {company.location.city}, {company.location.country}
                  </span>
                </div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        );
      })}
    </Map>
  );
}
