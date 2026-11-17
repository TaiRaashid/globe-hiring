"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "@/components/map";
import type { Company } from "@/types/company";
import { formatWorkMode } from "@/types/company";
import type { Filters } from "./types/filters";
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
  companies: Company[];
  activeId: string | null;
  filters: Filters;
  onMarkerClick?: (id: string) => void;
};

const Globe = forwardRef<MapRef, GlobeProps>(function Globe(
  { companies, activeId, filters, onMarkerClick },
  ref,
) {
  const mapRef = useRef<MapRef | null>(null);
  const setMapRef = useCallback(
    (instance: MapRef | null) => {
      mapRef.current = instance;
      if (typeof ref === "function") ref(instance);
      else if (ref) ref.current = instance;
    },
    [ref],
  );

  const [hoveredCompany, setHoveredCompany] = useState<{
    coordinates: [number, number];
    company: Company;
  } | null>(null);
  const previousCameraRef = useRef<CameraState | null>(null);

  const filteredGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, { id: string }>>(
    () => ({
      type: "FeatureCollection",
      features: companies
        .filter((company) => {
          if (!company.location) return false;

          if (
            filters.industries.length &&
            !filters.industries.some((industry) =>
              company.industries.some(
                (item) => item.toLowerCase() === industry.toLowerCase(),
              ),
            )
          ) return false;

          if (filters.workModes.length && (!company.workMode || !filters.workModes.includes(company.workMode))) {
            return false;
          }

          return true;
        })
        .map((company) => ({
          type: "Feature",
          properties: { id: company.id },
          geometry: {
            type: "Point",
            coordinates: [
              company.location!.longitude,
              company.location!.latitude,
            ],
          },
        })),
    }),
    [companies, filters],
  );

  useEffect(() => {
    if (!activeId || !mapRef.current) return;
    const company = companies.find((item) => item.id === activeId);
    if (!company?.location) return;

    if (!previousCameraRef.current) {
      previousCameraRef.current = {
        zoom: mapRef.current.getZoom(),
        pitch: mapRef.current.getPitch(),
        bearing: mapRef.current.getBearing(),
      };
    }

    mapRef.current.flyTo({
      center: [company.location.longitude, company.location.latitude],
      zoom: 18,
      pitch: 55,
      bearing: 0,
      speed: 0.7,
      curve: 1.2,
      easing: (t) => t,
      essential: true,
    });
  }, [activeId, companies]);

  useEffect(() => {
    if (activeId !== null || !mapRef.current || !previousCameraRef.current) return;

    const map = mapRef.current;
    const previous = previousCameraRef.current;
    map.flyTo({
      zoom: previous.zoom,
      pitch: previous.pitch,
      bearing: previous.bearing,
      speed: 0.9,
      curve: 1.3,
      easing: (t) => t,
      essential: true,
    });
    previousCameraRef.current = null;
  }, [activeId]);

  return (
    <Map
      ref={setMapRef}
      projection={{ type: "globe" }}
      center={[72.95, 21.69]}
      zoom={8}
      minZoom={1.2}
      maxZoom={20}
    >
      <MapClusterLayer<{ id: string }>
        data={filteredGeoJson}
        clusterMaxZoom={7}
        clusterRadius={50}
        clusterColors={["#64748b", "#0f766e", "#14b8a6"]}
        clusterThresholds={[10, 100]}
        pointColor="#094944"
        onPointClick={(feature) => {
          const id = feature.properties?.id;
          if (id) onMarkerClick?.(id);
        }}
        onPointHover={(
          feature: GeoJSON.Feature<GeoJSON.Point, { id: string }>,
          coordinates: [number, number],
        ) => {
          const id = feature.properties?.id;
          if (!id) return;
          const company = companies.find((item) => item.id === id);
          if (company) setHoveredCompany({ coordinates, company });
        }}
        onPointLeave={() => setHoveredCompany(null)}
      />

      {hoveredCompany && (
        <MapPopup
          longitude={hoveredCompany.coordinates[0]}
          latitude={hoveredCompany.coordinates[1]}
          closeOnClick={false}
          closeButton={false}
          focusAfterOpen={false}
          className="pointer-events-none rounded-lg border bg-slate-900/90 text-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-200 border-white/10 dark:bg-white/95 dark:text-slate-900 dark:border-black/10"
        >
          <div className="min-w-56 space-y-2">
            <p className="text-sm font-semibold leading-tight tracking-tight">
              {hoveredCompany.company.name}
            </p>
            <p className="line-clamp-2 text-xs text-slate-400 dark:text-slate-500">
              {hoveredCompany.company.industries.join(", ")}
            </p>
            <div className="h-px w-full bg-white/10 dark:bg-black/10" />
            <div className="flex justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span className="uppercase tracking-wide">
                {formatWorkMode(hoveredCompany.company.workMode)}
              </span>
              <span>
                {hoveredCompany.company.location?.city},{" "}
                {hoveredCompany.company.location?.country}
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
