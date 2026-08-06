<template>
  <q-page class="map-page">
    <div ref="mapContainer" class="map-container" />
  </q-page>
</template>

<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { DARK, layers, LIGHT, type Flavor } from "@protomaps/basemaps";
import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Protocol } from "pmtiles";
import { onMounted, onUnmounted, ref, watch } from "vue";

import {
  MAP_CENTER,
  MAP_GLYPHS_URL,
  MAP_SPRITE_URLS,
  MAP_ZOOM,
  PMTILES_URL
} from "@/config/map";
import { themeMode } from "@/config/theme";

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | undefined;
let protocol: Protocol | undefined;

function getMapFlavor(flavor: Flavor): Flavor {
  return {
    ...flavor,
    pois: {
      blue: "#0077FF",
      green: "#00A651",
      lapis: "#264DFF",
      pink: "#FF2E9F",
      red: "#FF2D55",
      slategray: "#5B5CE2",
      tangerine: "#FF8A00",
      turquoise: "#00BCD4"
    }
  };
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
    layers: layers("protomaps", getMapFlavor(baseFlavor), { lang: "en" })
  };
}

function applyTheme() {
  map?.setStyle(getMapStyle());
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
    center: MAP_CENTER,
    zoom: MAP_ZOOM
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");
});

watch(themeMode, applyTheme);

onUnmounted(() => {
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
