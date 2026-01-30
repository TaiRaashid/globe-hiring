"use client";

import { forwardRef,useEffect, useRef, useState } from "react";
import type { MapRef } from "@/components/map";
import type { Startup } from "./types/startup";
import { startupsGeoJson } from "@/data/startups-geojson";
import { type Filters } from "./types/filters";
import {
  Map,
  MapClusterLayer,
  MapPopup,
  MapControls,
} from "@/components/map";

type CameraState = {
  zoom: number;
  pitch: number;
  bearing: number;
};

type GlobeProps = {
  startups: Startup[];
  activeId: string | null;
  filters: Filters;
  onMarkerClick?: (id: string) => void;
};

const Globe = forwardRef<MapRef, GlobeProps>(function Globe(
  { startups, activeId, filters, onMarkerClick },
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

  const previousCameraRef = useRef<CameraState | null>(null);

  const filteredGeoJson = {
    ...startupsGeoJson,
    features: startupsGeoJson.features.filter((f) => {
      const id = f.properties?.id;
      const s = startups.find((x) => x.id === id);
      if (!s) return false;

      if (
        filters.industries.length &&
        !filters.industries.some((i: string) =>
          s.industries.map((x) => x.toLowerCase()).includes(i.toLowerCase())
        )
      ) return false;

      if (
        filters.workModes.length &&
        !filters.workModes.includes(s.work_mode)
      ) return false;

      if (filters.hiringOnly && s.jobs.total === 0) return false;

      return true;
    }),
  };

  const [animatedGeoJson, setAnimatedGeoJson] = useState(filteredGeoJson);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimatedGeoJson(filteredGeoJson);
    });

    return () => cancelAnimationFrame(id);
  }, [filteredGeoJson]);

  // Fly to active startup
  useEffect(() => {
    if (!activeId || !mapRef.current) return;

    const company = startups.find((s) => s.id === activeId);
    if (!company) return;
    
    if (!previousCameraRef.current) {
      previousCameraRef.current = {
        zoom: mapRef.current.getZoom(),
        pitch: mapRef.current.getPitch(),
        bearing: mapRef.current.getBearing(),
      };
    }
    mapRef.current.flyTo({
      center: [company.location.lng, company.location.lat],
      zoom: 18,
      pitch: 55,        // tilt the camera
      bearing: 0,
      speed: 0.7,        
      curve: 1.2,        
      easing: (t) => t,  
      essential: true,
    });
  }, [activeId, startups]);

  useEffect(() => {
    if (activeId !== null) return;
    if (!mapRef.current) return;
    if (!previousCameraRef.current) return;

    const map = mapRef.current;
    const prev = previousCameraRef.current;

    map.flyTo({
      zoom: prev.zoom,
      pitch: prev.pitch,
      bearing: prev.bearing,
      speed: 0.9,
      curve: 1.3,
      easing: (t) => t,
      essential: true,
    });

    previousCameraRef.current = null;
  }, [activeId]);

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
        data={animatedGeoJson}
        clusterMaxZoom={7}
        clusterRadius={50} 
        clusterColors={[
          "#64748b", // low hiring
          "#22c55e", // moderate hiring
          "#8b5cf6", // high hiring
        ]}
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