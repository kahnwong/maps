import {
  cellToBoundary,
  cellToLatLng,
  getResolution,
  isValidCell,
  latLngToCell,
  polygonToCells
} from "h3-js";
import type { H3Index } from "h3-js";
import type { LngLatBounds } from "maplibre-gl";

export interface H3FeatureProperties {
  h3Cell: string;
}

export interface H3PolygonFeature {
  type: "Feature";
  properties: H3FeatureProperties;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface H3PointFeature {
  type: "Feature";
  properties: H3FeatureProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface H3FeatureCollection {
  type: "FeatureCollection";
  features: Array<H3PolygonFeature | H3PointFeature>;
}

// ref: <https://github.com/clupasq/h3-viewer/blob/e52436d68df77f30c923701ea16a2a917e4b2e08/map.js#L19-L40>
const ZOOM_TO_H3_RES_CORRESPONDENCE = {
  5: 1,
  6: 2,
  7: 3,
  8: 3,
  9: 4,
  10: 5,
  11: 6,
  12: 6,
  13: 7,
  14: 8,
  15: 9,
  16: 9,
  17: 10,
  18: 10,
  19: 11,
  20: 11,
  21: 12,
  22: 13,
  23: 14,
  24: 15
} as const;

const H3_RESOLUTION_ZOOM_ENTRIES = Object.entries(
  ZOOM_TO_H3_RES_CORRESPONDENCE
).map(([zoom, resolution]) => ({
  zoom: Number(zoom),
  resolution
}));

export function getH3ResolutionForZoom(zoom: number) {
  const roundedZoom = Math.round(zoom);
  const clampedZoom = Math.min(24, Math.max(5, roundedZoom));
  return ZOOM_TO_H3_RES_CORRESPONDENCE[
    clampedZoom as keyof typeof ZOOM_TO_H3_RES_CORRESPONDENCE
  ];
}

export function getMapZoomForH3Resolution(resolution: number) {
  return (
    H3_RESOLUTION_ZOOM_ENTRIES.find(entry => entry.resolution >= resolution)
      ?.zoom ?? 24
  );
}

export function normalizeH3CellId(value: string) {
  const h3Cell = value.trim();
  return isValidCell(h3Cell) ? h3Cell : undefined;
}

export function getH3CellResolution(h3Cell: string) {
  return getResolution(h3Cell);
}

export function getH3CellCenter(h3Cell: string): [number, number] {
  const [lat, lng] = cellToLatLng(h3Cell);
  return [lng, lat];
}

export function getH3CellForLatLng(
  lat: number,
  lng: number,
  resolution: number
) {
  return latLngToCell(lat, lng, resolution);
}

export function getEmptyH3FeatureCollection(): H3FeatureCollection {
  return {
    type: "FeatureCollection",
    features: []
  };
}

export function getH3FeatureCollection(
  bounds: LngLatBounds,
  resolution: number
): H3FeatureCollection {
  const west = bounds.getWest();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const north = bounds.getNorth();
  const polygon = [
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south]
    ]
  ];
  const h3Cells = polygonToCells(polygon, resolution, true);
  const features = h3Cells.flatMap(h3CellToFeatures);

  return {
    type: "FeatureCollection",
    features
  };
}

function h3CellToFeatures(h3Cell: H3Index): [H3PolygonFeature, H3PointFeature] {
  const boundary = cellToBoundary(h3Cell, true) as number[][];
  const [lat, lng] = cellToLatLng(h3Cell);

  return [
    {
      type: "Feature",
      properties: {
        h3Cell: String(h3Cell)
      },
      geometry: {
        type: "Polygon",
        coordinates: [boundary]
      }
    },
    {
      type: "Feature",
      properties: {
        h3Cell: String(h3Cell)
      },
      geometry: {
        type: "Point",
        coordinates: [lng, lat]
      }
    }
  ];
}
