import type { Map } from "maplibre-gl";

import type { ThemeMode } from "@/config/theme";

export interface MapView {
  center: [number, number];
  zoom: number;
}

export function getQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return typeof value === "string" ? value : undefined;
}

export function parseThemeQuery(value: unknown): ThemeMode | undefined {
  const theme = getQueryValue(value);
  return theme === "light" || theme === "dark" ? theme : undefined;
}

export function parseMapQuery(value: unknown): MapView | undefined {
  const mapQuery = getQueryValue(value);
  const [zoom, latitude, longitude] = mapQuery?.split("/").map(Number) ?? [];

  if (
    zoom === undefined ||
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(zoom) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return undefined;
  }

  return {
    center: [longitude, latitude],
    zoom
  };
}

export function formatMapQuery(map: Map) {
  const center = map.getCenter();
  return `${map.getZoom().toFixed(2)}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`;
}
