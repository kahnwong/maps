import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Protocol } from "pmtiles";
import { Notify } from "quasar";
import type { Ref } from "vue";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { MAP_CENTER, MAP_ZOOM } from "@/config/map";
import { themeMode } from "@/config/theme";
import {
  formatMapQuery,
  getQueryValue,
  parseMapQuery,
  parseThemeQuery
} from "@/lib/map/query";
import {
  getEmptyH3FeatureCollection,
  getH3CellCenter,
  getH3CellForLatLng,
  getH3CellResolution,
  getH3FeatureCollection,
  getH3ResolutionForZoom,
  getMapZoomForH3Resolution,
  normalizeH3CellId
} from "@/lib/map/h3";
import { getMapStyle } from "@/lib/map/style";

const H3_SOURCE_ID = "h3-cells";
const H3_FILL_LAYER_ID = "h3-cells-fill";
const H3_LINE_LAYER_ID = "h3-cells-line";
const H3_LABEL_LAYER_ID = "h3-cells-label";

export function useMapLibreMap(mapContainer: Ref<HTMLDivElement | null>) {
  const route = useRoute();
  const router = useRouter();
  let map: maplibregl.Map | undefined;
  let protocol: Protocol | undefined;
  let queryUpdateTimer: ReturnType<typeof setTimeout> | undefined;
  let isApplyingRouteQuery = false;
  const h3Enabled = ref(false);

  const initialTheme = parseThemeQuery(route.query.theme);
  if (initialTheme) {
    themeMode.value = initialTheme;
  }

  const initialMapView = parseMapQuery(route.query.map);
  const h3Resolution = ref(
    getH3ResolutionForZoom(initialMapView?.zoom ?? MAP_ZOOM)
  );

  function updateQuery() {
    if (!map || isApplyingRouteQuery) {
      return;
    }

    const nextQuery = {
      ...route.query,
      theme: themeMode.value,
      map: formatMapQuery(map)
    };

    if (
      route.query.theme === nextQuery.theme &&
      route.query.map === nextQuery.map
    ) {
      return;
    }

    void router.replace({ query: nextQuery });
  }

  function scheduleQueryUpdate() {
    if (isApplyingRouteQuery) {
      return;
    }

    if (queryUpdateTimer) {
      clearTimeout(queryUpdateTimer);
    }

    queryUpdateTimer = setTimeout(() => {
      queryUpdateTimer = undefined;
      updateQuery();
    }, 150);
  }

  function applyTheme() {
    map?.setStyle(getMapStyle(themeMode.value));
    updateQuery();
  }

  function applyMapQuery(value: unknown) {
    if (!map) {
      return;
    }

    const mapQuery = getQueryValue(value);
    if (mapQuery === formatMapQuery(map)) {
      return;
    }

    const mapView = parseMapQuery(value);
    isApplyingRouteQuery = true;
    map.jumpTo({
      center: mapView?.center ?? MAP_CENTER,
      zoom: mapView?.zoom ?? MAP_ZOOM
    });
    isApplyingRouteQuery = false;
  }

  function setH3ResolutionFromZoom() {
    if (!map) {
      return;
    }

    h3Resolution.value = getH3ResolutionForZoom(map.getZoom());
  }

  function syncH3Overlay() {
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    removeH3Layers();

    if (!h3Enabled.value) {
      removeH3Source();
      return;
    }

    if (!map.getSource(H3_SOURCE_ID)) {
      map.addSource(H3_SOURCE_ID, {
        type: "geojson",
        data: getEmptyH3FeatureCollection()
      });
    }

    map.addLayer({
      id: H3_FILL_LAYER_ID,
      type: "fill",
      source: H3_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": themeMode.value === "dark" ? "#64B5F6" : "#1565C0",
        "fill-opacity": 0.08
      }
    });
    map.addLayer({
      id: H3_LINE_LAYER_ID,
      type: "line",
      source: H3_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "line-color": themeMode.value === "dark" ? "#90CAF9" : "#0D47A1",
        "line-opacity": 0.8,
        "line-width": 3
      }
    });
    map.addLayer({
      id: H3_LABEL_LAYER_ID,
      type: "symbol",
      source: H3_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Point"],
      layout: {
        "text-field": ["get", "h3Cell"],
        "text-size": 10,
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": themeMode.value === "dark" ? "#FFFFFF" : "#0D47A1",
        "text-halo-color": themeMode.value === "dark" ? "#000000" : "#FFFFFF",
        "text-halo-width": 1.5
      }
    });
    updateH3Overlay();
  }

  function ensureH3Overlay() {
    if (
      !map ||
      !h3Enabled.value ||
      !map.isStyleLoaded() ||
      map.getLayer(H3_FILL_LAYER_ID)
    ) {
      return;
    }

    syncH3Overlay();
  }

  function updateH3Overlay() {
    if (!map || !h3Enabled.value || !map.getSource(H3_SOURCE_ID)) {
      return;
    }

    setH3ResolutionFromZoom();
    const source = map.getSource(H3_SOURCE_ID) as GeoJSONSource;
    void source.setData(
      getH3FeatureCollection(map.getBounds(), h3Resolution.value)
    );
  }

  function removeH3Layers() {
    if (!map) {
      return;
    }

    for (const layerId of [
      H3_LABEL_LAYER_ID,
      H3_LINE_LAYER_ID,
      H3_FILL_LAYER_ID
    ]) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    }
  }

  function removeH3Source() {
    if (map?.getSource(H3_SOURCE_ID)) {
      map.removeSource(H3_SOURCE_ID);
    }
  }

  async function copyH3Cell(h3Cell: string) {
    try {
      await navigator.clipboard.writeText(h3Cell);
      Notify.create({
        message: `Copied H3 cell ${h3Cell}`,
        position: "bottom",
        timeout: 1800,
        type: "positive"
      });
    } catch {
      Notify.create({
        message: "Unable to copy H3 cell ID.",
        position: "bottom",
        type: "negative"
      });
    }
  }

  function handleH3Click(event: maplibregl.MapMouseEvent) {
    if (!map || !h3Enabled.value) {
      return;
    }

    const [feature] = map.queryRenderedFeatures(event.point, {
      layers: [H3_FILL_LAYER_ID]
    });
    const h3Cell = feature?.properties?.h3Cell;

    if (typeof h3Cell === "string") {
      void copyH3Cell(h3Cell);
    }
  }

  function jumpToH3Cell(value: string) {
    const h3Cell = normalizeH3CellId(value);

    if (!h3Cell || !map) {
      return false;
    }

    map.easeTo({
      center: getH3CellCenter(h3Cell),
      zoom: getMapZoomForH3Resolution(getH3CellResolution(h3Cell))
    });
    return true;
  }

  function jumpToLatLng(lat: number, lng: number) {
    if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return undefined;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return undefined;
    }

    const h3Cell = getH3CellForLatLng(lat, lng, h3Resolution.value);
    map.easeTo({
      center: [lng, lat],
      zoom: Math.max(
        map.getZoom(),
        getMapZoomForH3Resolution(h3Resolution.value)
      )
    });
    return String(h3Cell);
  }

  maplibregl.setWorkerUrl(maplibreWorkerUrl);

  onMounted(() => {
    if (!mapContainer.value) {
      return;
    }

    protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    map = new maplibregl.Map({
      container: mapContainer.value,
      style: getMapStyle(themeMode.value),
      center: initialMapView?.center ?? MAP_CENTER,
      zoom: initialMapView?.zoom ?? MAP_ZOOM
    });

    map.on("move", scheduleQueryUpdate);
    map.on("moveend", () => {
      updateQuery();
      updateH3Overlay();
    });
    map.on("zoomend", () => {
      setH3ResolutionFromZoom();
      updateH3Overlay();
    });
    map.on("style.load", syncH3Overlay);
    map.on("idle", ensureH3Overlay);
    map.on("click", H3_FILL_LAYER_ID, handleH3Click);

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    setH3ResolutionFromZoom();
    updateQuery();
  });

  watch(themeMode, applyTheme);
  watch(() => route.query.map, applyMapQuery);
  watch(h3Enabled, syncH3Overlay);

  onUnmounted(() => {
    if (queryUpdateTimer) {
      clearTimeout(queryUpdateTimer);
      queryUpdateTimer = undefined;
    }

    map?.off("move", scheduleQueryUpdate);
    map?.off("style.load", syncH3Overlay);
    map?.off("idle", ensureH3Overlay);
    map?.off("click", H3_FILL_LAYER_ID, handleH3Click);
    map?.remove();
    map = undefined;
    maplibregl.removeProtocol("pmtiles");
    protocol = undefined;
  });

  return {
    h3Enabled,
    h3Resolution,
    jumpToH3Cell,
    jumpToLatLng
  };
}
