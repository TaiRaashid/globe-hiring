"use client";

import { useEffect, useRef, useState } from "react";
import type { MapRef } from "@/components/map";
import type { Startup } from "./types/startup";
import { startupsGeoJson } from "@/data/startups-geojson";

import {
  Map,
  MapClusterLayer,
  MapPopup,
  MapControls,
} from "@/components/map";

type GlobeProps = {
  startups: Startup[];
  activeId: string | null;
  onMarkerClick?: (id: string) => void;
};

export default function Globe({
  startups,
  activeId,
  onMarkerClick,
}: GlobeProps) {
  const mapRef = useRef<MapRef | null>(null);

  const [hoveredStartup, setHoveredStartup] = useState<{
    coordinates: [number, number];
    startup: Startup;
  } | null>(null);

  // Fly to active startup
  useEffect(() => {
    if (!activeId || !mapRef.current) return;

    const company = startups.find((s) => s.id === activeId);
    if (!company) return;

    mapRef.current.flyTo({
      center: [company.location.lng, company.location.lat],
      zoom: 20,
      duration: 1200,
      essential: true,
    });
  }, [activeId, startups]);

  return (
    <Map
      ref={mapRef}
      projection={{ type: "globe" }}
      center={[72.95, 21.69]}
      zoom={8}
      minZoom={1.2}
      maxZoom={16}
      renderWorldCopies={false}
      fadeDuration={0}
    >
      {/* Cluster layer */}
      <MapClusterLayer<{ id: string }>
        data={startupsGeoJson}
        clusterMaxZoom={7}
        clusterRadius={10}
        clusterColors={["#14b8a6", "#2563eb", "#7c3aed"]}
        clusterThresholds={[10, 100]}
        pointColor="#094944"

        onPointClick={(feature) => {
          const id = feature.properties?.id;
          if (!id) return;
          onMarkerClick?.(id); // click still opens Sheet
        }}

        onPointHover={(
          feature: GeoJSON.Feature<GeoJSON.Point, { id: string }>,
          coordinates: [number, number]
        ) => {
          const id = feature.properties?.id;
          if (!id) return;

          const startup = startups.find((s) => s.id === id);
          if (!startup) return;

          setHoveredStartup({ coordinates, startup });
        }}

        onPointLeave={() => {
          setHoveredStartup(null);
        }}
      />

      {/* Hover tooltip */}
      {hoveredStartup && (
        <MapPopup
          longitude={hoveredStartup.coordinates[0]}
          latitude={hoveredStartup.coordinates[1]}
          closeOnClick={false}
          closeButton={false}
          focusAfterOpen={false}
          className="
            pointer-events-none
            rounded-lg
            border
            shadow-lg
            transition-colors
            bg-slate-800 text-white border-slate-200
            dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700
          "
        >
          <div className="min-w-48 space-y-1">
            <p className="text-sm font-semibold">
              {hoveredStartup.startup.name}
            </p>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {hoveredStartup.startup.industries.join(", ")}
            </p>

            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{hoveredStartup.startup.work_mode}</span>
              <span>
                {hoveredStartup.startup.location.city},{" "}
                {hoveredStartup.startup.location.country}
              </span>
            </div>
          </div>
        </MapPopup>
      )}

      <MapControls />
    </Map>
  );
}
