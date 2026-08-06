<template>
  <q-page class="map-page">
    <div ref="mapContainer" class="map-container" />
  </q-page>
</template>

<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { layers, LIGHT } from "@protomaps/basemaps";
import * as maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Protocol } from "pmtiles";
import { onMounted, onUnmounted, ref } from "vue";

import {
  MAP_CENTER,
  MAP_ZOOM,
  MAP_GLYPHS_URL,
  PMTILES_URL
} from "@/config/map";

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | undefined;
let protocol: Protocol | undefined;

const mapStyle: StyleSpecification = {
  version: 8,
  glyphs: MAP_GLYPHS_URL,
  sources: {
    protomaps: {
      type: "vector",
      url: `pmtiles://${PMTILES_URL}`
    }
  },
  layers: layers("protomaps", LIGHT, { lang: "en" })
};

maplibregl.setWorkerUrl(maplibreWorkerUrl);

onMounted(() => {
  if (!mapContainer.value) {
    return;
  }

  protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle,
    center: MAP_CENTER,
    zoom: MAP_ZOOM
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");
});

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
