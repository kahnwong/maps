import {
  cellToBoundary,
  cellToLatLng,
  getResolution,
  isValidCell,
  latLngToCell,
  polygonToCells
} from "h3-js";

// https://github.com/clupasq/h3-viewer/blob/e52436d68df77f30c923701ea16a2a917e4b2e08/map.js#L19-L40
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
};

export function getH3ResolutionForZoom(zoom) {
  return ZOOM_TO_H3_RES_CORRESPONDENCE[
    Math.min(24, Math.max(5, Math.round(zoom)))
  ];
}

export function getMapZoomForH3Resolution(resolution) {
  const entry = Object.entries(ZOOM_TO_H3_RES_CORRESPONDENCE).find(
    ([, value]) => value >= resolution
  );
  return entry ? Number(entry[0]) : 24;
}

export function normalizeH3CellId(value) {
  const cell = value.trim();
  return isValidCell(cell) ? cell : undefined;
}

export const getH3CellResolution = getResolution;
export const getH3CellForLatLng = latLngToCell;

export function getH3CellCenter(cell) {
  const [lat, lng] = cellToLatLng(cell);
  return [lng, lat];
}

export function getEmptyH3FeatureCollection() {
  return { type: "FeatureCollection", features: [] };
}

export function getH3FeatureCollection(bounds, resolution) {
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
  return {
    type: "FeatureCollection",
    features: polygonToCells(polygon, resolution, true).flatMap(cell => [
      {
        type: "Feature",
        properties: { h3Cell: String(cell) },
        geometry: { type: "Polygon", coordinates: [cellToBoundary(cell, true)] }
      },
      {
        type: "Feature",
        properties: { h3Cell: String(cell) },
        geometry: { type: "Point", coordinates: getH3CellCenter(cell) }
      }
    ])
  };
}
