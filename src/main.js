import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { Protocol } from "pmtiles";
import { H3_OVERLAY_COLORS, MAP_CENTER, MAP_ZOOM } from "./config/map.js";
import {
  formatMapQuery,
  parseMapQuery,
  parseThemeQuery,
  parseLatLngInput
} from "./lib/map/query.js";
import {
  getH3CellCenter,
  getH3CellForLatLng,
  getH3CellResolution,
  getH3FeatureCollection,
  getEmptyH3FeatureCollection,
  getH3ResolutionForZoom,
  getMapZoomForH3Resolution,
  normalizeH3CellId
} from "./lib/map/h3.js";
import { getMapStyle } from "./lib/map/style.js";

const themeButton = document.querySelector("#theme-toggle");
const overlayToggle = document.querySelector("#h3-enabled");
const resolutionLabel = document.querySelector("#h3-resolution");
const cellInput = document.querySelector("#h3-cell");
const coordinatesInput = document.querySelector("#coordinates");
const notification = document.querySelector("#notification");
const sourceId = "h3-cells";
const fillId = "h3-cells-fill";
const lineId = "h3-cells-line";
const labelId = "h3-cells-label";
let notificationTimer;
let queryTimer;
let applyingQuery = false;

// Accept links from the former hash-based router as well as normal query URLs.
if (location.hash.startsWith("#/?")) {
  const url = new URL(location.href);
  for (const [key, value] of new URLSearchParams(location.hash.slice(3))) {
    url.searchParams.set(key, value);
  }
  url.hash = "";
  history.replaceState(null, "", url);
}
const query = new URLSearchParams(location.search);
let theme = parseThemeQuery(query.get("theme")) ?? "light";
const initialView = parseMapQuery(query.get("map"));
let resolution = getH3ResolutionForZoom(initialView?.zoom ?? MAP_ZOOM);

function notify(message, error = false) {
  clearTimeout(notificationTimer);
  notification.textContent = message;
  notification.dataset.error = String(error);
  notificationTimer = setTimeout(
    () => {
      notification.textContent = "";
    },
    error ? 4000 : 1800
  );
}

maplibregl.setWorkerUrl(maplibreWorkerUrl);
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);
const map = new maplibregl.Map({
  container: "map",
  style: getMapStyle(theme),
  center: initialView?.center ?? MAP_CENTER,
  zoom: initialView?.zoom ?? MAP_ZOOM,
  maxZoom: 24
});
map.addControl(new maplibregl.NavigationControl(), "top-right");

function updateQuery() {
  if (applyingQuery) return;
  const url = new URL(location.href);
  url.searchParams.set("theme", theme);
  url.searchParams.set("map", formatMapQuery(map));
  if (url.href !== location.href) history.replaceState(null, "", url);
}

function updateThemeButton() {
  themeButton.textContent = theme === "light" ? "☾" : "☀";
  themeButton.setAttribute(
    "aria-label",
    `Switch to ${theme === "light" ? "dark" : "light"} theme`
  );
}

function updateResolution() {
  resolution = getH3ResolutionForZoom(map.getZoom());
  resolutionLabel.textContent = `Resolution: ${resolution}`;
  resolutionLabel.hidden = !overlayToggle.checked;
}

function updateOverlay() {
  updateResolution();
  if (!overlayToggle.checked || !map.getSource(sourceId)) return;
  map
    .getSource(sourceId)
    .setData(getH3FeatureCollection(map.getBounds(), resolution));
}

function syncOverlay() {
  if (!map.isStyleLoaded()) return;
  for (const id of [labelId, lineId, fillId]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (!overlayToggle.checked) {
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    return;
  }
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: getEmptyH3FeatureCollection()
    });
  }
  map.addLayer({
    id: fillId,
    type: "fill",
    source: sourceId,
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": H3_OVERLAY_COLORS.fill[theme], "fill-opacity": 0.08 }
  });
  map.addLayer({
    id: lineId,
    type: "line",
    source: sourceId,
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "line-color": H3_OVERLAY_COLORS.line[theme],
      "line-opacity": 0.8,
      "line-width": 3
    }
  });
  map.addLayer({
    id: labelId,
    type: "symbol",
    source: sourceId,
    filter: ["==", ["geometry-type"], "Point"],
    layout: {
      "text-field": ["get", "h3Cell"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 10,
      "text-allow-overlap": false,
      "text-ignore-placement": false
    },
    paint: {
      "text-color": H3_OVERLAY_COLORS.text[theme],
      "text-halo-color": H3_OVERLAY_COLORS.textHalo[theme],
      "text-halo-width": 1.5
    }
  });
  updateOverlay();
}

map.on("move", () => {
  clearTimeout(queryTimer);
  if (!applyingQuery) queryTimer = setTimeout(updateQuery, 150);
});
map.on("moveend", () => {
  updateQuery();
  updateOverlay();
});
map.on("zoomend", updateOverlay);
map.on("style.load", syncOverlay);
map.on("idle", () => {
  if (overlayToggle.checked && !map.getLayer(fillId)) syncOverlay();
});
map.on("click", async event => {
  if (!overlayToggle.checked || !map.getLayer(fillId)) return;
  const [feature] = map.queryRenderedFeatures(event.point, {
    layers: [fillId]
  });
  const cell = feature?.properties?.h3Cell;
  if (typeof cell !== "string") return;
  try {
    await navigator.clipboard.writeText(cell);
    notify(`Copied H3 cell ${cell}`);
  } catch {
    notify("Unable to copy H3 cell ID.", true);
  }
});

themeButton.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  updateThemeButton();
  map.setStyle(getMapStyle(theme));
  updateQuery();
});
overlayToggle.addEventListener("change", () => {
  updateResolution();
  syncOverlay();
});

document.querySelector("#h3-form").addEventListener("submit", event => {
  event.preventDefault();
  const cell = normalizeH3CellId(cellInput.value);
  if (!cell) return notify("Enter a valid H3 cell ID.", true);
  map.easeTo({
    center: getH3CellCenter(cell),
    zoom: getMapZoomForH3Resolution(getH3CellResolution(cell))
  });
});

document
  .querySelector("#coordinates-form")
  .addEventListener("submit", event => {
    event.preventDefault();
    const coordinates = parseLatLngInput(coordinatesInput.value);
    if (!coordinates)
      return notify("Enter coordinates as latitude,longitude.", true);
    const { latitude, longitude } = coordinates;
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return notify(
        "Latitude must be -90 to 90 and longitude must be -180 to 180.",
        true
      );
    }
    cellInput.value = getH3CellForLatLng(latitude, longitude, resolution);
    map.easeTo({
      center: [longitude, latitude],
      zoom: Math.max(map.getZoom(), getMapZoomForH3Resolution(resolution))
    });
  });

window.addEventListener("popstate", () => {
  clearTimeout(queryTimer);
  const params = new URLSearchParams(location.search);
  const nextTheme = parseThemeQuery(params.get("theme")) ?? "light";
  const view = parseMapQuery(params.get("map"));
  applyingQuery = true;
  try {
    if (nextTheme !== theme) {
      theme = nextTheme;
      updateThemeButton();
      map.setStyle(getMapStyle(theme));
    }
    map.jumpTo({
      center: view?.center ?? MAP_CENTER,
      zoom: view?.zoom ?? MAP_ZOOM
    });
  } finally {
    applyingQuery = false;
  }
});

updateThemeButton();
updateResolution();
updateQuery();

if (import.meta.env.PROD) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://vzdko.karnwong.me/script.js";
  script.dataset.websiteId = "b83a33a7-aeef-4f6d-b1f0-d8a8bdc25ced";
  document.head.appendChild(script);
}
