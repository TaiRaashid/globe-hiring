"use client";

import { forwardRef,useEffect, useRef, useState } from "react";
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

const Globe = forwardRef<MapRef, GlobeProps>(function Globe(
  { startups, activeId, onMarkerClick },
  ref
) {
  const mapRef = useRef<MapRef | null>(null);
  useEffect(() => {
    if (!ref) return;
    if(!mapRef.current)return;
    if (typeof ref === "function") {
      ref(mapRef.current);
    } else {
      ref.current = mapRef.current;
    }
  }, [ref,mapRef.current]);
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
      zoom: 25,
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
      maxZoom={20}
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
            backdrop-blur-xl
            shadow-[0_12px_30px_rgba(0,0,0,0.35)]
            transition-all duration-200
            bg-slate-900/90 text-slate-100 border-white/10
            dark:bg-white/95 dark:text-slate-900 dark:border-black/10
          "
        >
          <div className="min-w-56 space-y-2">
            {/*Title*/}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight tracking-tight">
                {hoveredStartup.startup.name}
              </p>
            </div>
            {/*Industries*/}
            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">
              {hoveredStartup.startup.industries.join(", ")}
            </p>
            {/*Divider*/}
            <div className="h-px w-full bg-white/10 dark:bg-black/10"/>

            <div className="flex justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span className="uppercase tracking-wide">
                {hoveredStartup.startup.work_mode}
              </span>
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
});

export default Globe;