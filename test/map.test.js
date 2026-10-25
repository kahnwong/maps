import assert from "node:assert/strict";
import test from "node:test";
import {
  formatMapQuery,
  parseMapQuery,
  parseThemeQuery,
  parseLatLngInput
} from "../src/lib/map/query.js";
import {
  getH3CellForLatLng,
  getH3CellCenter,
  getH3CellResolution,
  getH3FeatureCollection,
  getH3ResolutionForZoom,
  getMapZoomForH3Resolution,
  normalizeH3CellId
} from "../src/lib/map/h3.js";
import { getMapStyle } from "../src/lib/map/style.js";

test("map query round-trips the view", () => {
  const value = formatMapQuery({
    getZoom: () => 9,
    getCenter: () => ({ lat: 13.736717, lng: 100.523186 })
  });
  assert.equal(value, "9.00/13.736717/100.523186");
  assert.deepEqual(parseMapQuery(value), {
    center: [100.523186, 13.736717],
    zoom: 9
  });
});

test("malformed map queries fall back safely", () => {
  for (const value of [
    null,
    "",
    "9//100",
    "9/91/100",
    "25/13/100",
    "-1/13/100",
    "9/13/100/1",
    "NaN/13/100",
    "9/13/Infinity"
  ]) {
    assert.equal(parseMapQuery(value), undefined, String(value));
  }
  assert.ok(parseMapQuery("9/13/460"), "wrapped world longitudes remain valid");
});

test("theme and coordinate validation", () => {
  assert.equal(parseThemeQuery("dark"), "dark");
  assert.equal(parseThemeQuery("light"), "light");
  assert.equal(parseThemeQuery("unknown"), undefined);
  assert.deepEqual(parseLatLngInput(" 13.7, 100.5 "), {
    latitude: 13.7,
    longitude: 100.5
  });
  for (const value of ["", ",", "13,", ",100", "13,100,1", "NaN,100"]) {
    assert.equal(parseLatLngInput(value), undefined);
  }
});

test("H3 lookup, resolution and geometry preserve map conventions", () => {
  const cell = getH3CellForLatLng(13.736717, 100.523186, 4);
  assert.equal(normalizeH3CellId(` ${cell} `), cell);
  assert.equal(normalizeH3CellId("invalid"), undefined);
  assert.equal(getH3CellResolution(cell), 4);
  const [lng, lat] = getH3CellCenter(cell);
  assert.ok(Math.abs(lat - 13.736717) < 1);
  assert.ok(Math.abs(lng - 100.523186) < 1);
  assert.equal(getH3ResolutionForZoom(9), 4);
  assert.equal(getH3ResolutionForZoom(-1), 1);
  assert.equal(getH3ResolutionForZoom(30), 15);
  assert.equal(getMapZoomForH3Resolution(4), 9);
  const collection = getH3FeatureCollection(
    {
      getWest: () => 100,
      getEast: () => 101,
      getSouth: () => 13,
      getNorth: () => 14
    },
    4
  );
  assert.ok(collection.features.length > 0);
  assert.equal(collection.features.length % 2, 0);
  const [polygon, point] = collection.features;
  assert.equal(polygon.geometry.type, "Polygon");
  assert.equal(point.geometry.type, "Point");
  assert.equal(polygon.properties.h3Cell, point.properties.h3Cell);
  assert.deepEqual(
    polygon.geometry.coordinates[0][0],
    polygon.geometry.coordinates[0].at(-1)
  );
});

test("both map themes retain PMTiles, sprites and POI styling", () => {
  for (const theme of ["light", "dark"]) {
    const style = getMapStyle(theme);
    assert.equal(style.version, 8);
    assert.ok(style.sources.protomaps.url.startsWith("pmtiles://"));
    assert.ok(style.sprite.endsWith(theme));
    assert.equal(
      style.layers.find(layer => layer.id === "pois").paint["icon-halo-width"],
      1
    );
  }
});
