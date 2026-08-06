<template>
  <q-page class="map-page">
    <div ref="mapContainer" class="map-container" />
  </q-page>
</template>

<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { DARK, layers, LIGHT } from "@protomaps/basemaps";
import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Protocol } from "pmtiles";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  MAP_CENTER,
  MAP_GLYPHS_URL,
  MAP_SPRITE_URLS,
  MAP_ZOOM,
  PMTILES_URL
} from "@/config/map";
import { type ThemeMode, themeMode } from "@/config/theme";

const mapContainer = ref<HTMLDivElement | null>(null);
const route = useRoute();
const router = useRouter();
let map: maplibregl.Map | undefined;
let protocol: Protocol | undefined;
let queryUpdateTimer: ReturnType<typeof setTimeout> | undefined;

function getQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return typeof value === "string" ? value : undefined;
}

function parseThemeQuery(value: unknown): ThemeMode | undefined {
  const theme = getQueryValue(value);
  return theme === "light" || theme === "dark" ? theme : undefined;
}

function parseMapQuery(value: unknown) {
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
    center: [longitude, latitude] as [number, number],
    zoom
  };
}

function formatMapQuery(currentMap: maplibregl.Map) {
  const center = currentMap.getCenter();
  return `${currentMap.getZoom().toFixed(2)}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`;
}

function updateQuery() {
  if (!map) {
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
  if (queryUpdateTimer) {
    clearTimeout(queryUpdateTimer);
  }

  queryUpdateTimer = setTimeout(() => {
    queryUpdateTimer = undefined;
    updateQuery();
  }, 150);
}

const initialTheme = parseThemeQuery(route.query.theme);
if (initialTheme) {
  themeMode.value = initialTheme;
}

const initialMapView = parseMapQuery(route.query.map);

function getMapLayers(
  flavor: typeof LIGHT | typeof DARK
): StyleSpecification["layers"] {
  return layers("protomaps", flavor, { lang: "en" }).map(layer => {
    if (layer.id !== "pois") {
      return layer;
    }

    const poiLayer = layer as maplibregl.SymbolLayerSpecification;

    return {
      ...poiLayer,
      layout: {
        ...poiLayer.layout,
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12,
          1,
          16,
          1.15,
          19,
          1.25
        ]
      },
      paint: {
        ...poiLayer.paint,
        "icon-halo-color": themeMode.value === "dark" ? "#000000" : "#FFFFFF",
        "icon-halo-width": 1,
        "icon-opacity": 1
      }
    };
  });
}

function getMapStyle(): StyleSpecification {
  const theme = themeMode.value;
  const baseFlavor = theme === "dark" ? DARK : LIGHT;

  return {
    version: 8,
    glyphs: MAP_GLYPHS_URL,
    sprite: MAP_SPRITE_URLS[theme],
    sources: {
      protomaps: {
        type: "vector",
        url: `pmtiles://${PMTILES_URL}`
      }
    },
    layers: getMapLayers(baseFlavor)
  };
}

function applyTheme() {
  map?.setStyle(getMapStyle());
  updateQuery();
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
    style: getMapStyle(),
    center: initialMapView?.center ?? MAP_CENTER,
    zoom: initialMapView?.zoom ?? MAP_ZOOM
  });

  map.on("move", scheduleQueryUpdate);
  map.on("moveend", updateQuery);

  map.addControl(new maplibregl.NavigationControl(), "top-right");
  updateQuery();
});

watch(themeMode, applyTheme);

onUnmounted(() => {
  if (queryUpdateTimer) {
    clearTimeout(queryUpdateTimer);
    queryUpdateTimer = undefined;
  }

  map?.off("move", scheduleQueryUpdate);
  map?.off("moveend", updateQuery);
  map?.remove();
  map = undefined;
  maplibregl.removeProtocol("pmtiles");
  protocol = undefined;
});
</script>

<style scoped>
.map-page {
  height: calc(100vh - 50px);
}

.map-container {
  height: 100%;
  width: 100%;
}
</style>
