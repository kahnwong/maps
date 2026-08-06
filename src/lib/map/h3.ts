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

export function getH3ResolutionForZoom(zoom: number) {
  if (zoom < 4) {
    return 2;
  }

  if (zoom < 6) {
    return 3;
  }

  if (zoom < 8) {
    return 4;
  }

  if (zoom < 10) {
    return 5;
  }

  if (zoom < 12) {
    return 6;
  }

  if (zoom < 14) {
    return 7;
  }

  if (zoom < 16) {
    return 8;
  }

  if (zoom < 18) {
    return 9;
  }

  return 10;
}

export function getMapZoomForH3Resolution(resolution: number) {
  return Math.min(19, Math.max(4, resolution * 2));
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
