<template>
  <q-page class="map-page">
    <div ref="mapContainer" class="map-container" />

    <H3OverlayPanel
      v-model:enabled="h3Enabled"
      :jump-to-h3-cell="jumpToH3Cell"
      :jump-to-lat-lng="jumpToLatLng"
      :resolution="h3Resolution"
    />
  </q-page>
</template>

<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { ref } from "vue";

import H3OverlayPanel from "@/components/H3OverlayPanel.vue";
import { useMapLibreMap } from "@/composables/useMapLibreMap";

const mapContainer = ref<HTMLDivElement | null>(null);
const { h3Enabled, h3Resolution, jumpToH3Cell, jumpToLatLng } =
  useMapLibreMap(mapContainer);
</script>

<style scoped>
.map-page {
  height: calc(100vh - 50px);
  position: relative;
}

.map-container {
  height: 100%;
  width: 100%;
}
</style>
