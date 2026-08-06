<template>
  <q-page class="map-page">
    <div ref="mapContainer" class="map-container" />
  </q-page>
</template>

<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { ref } from "vue";

import { useMapLibreMap } from "@/composables/useMapLibreMap";

const mapContainer = ref<HTMLDivElement | null>(null);
useMapLibreMap(mapContainer);
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
