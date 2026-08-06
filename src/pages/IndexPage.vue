<template>
  <q-page class="map-page">
    <div ref="mapContainer" class="map-container" />

    <q-card class="h3-panel" flat bordered>
      <q-card-section class="q-gutter-sm">
        <div class="h3-toggle-row">
          <q-toggle
            v-model="h3Enabled"
            label="H3 Overlay"
            style="margin-left: -4px"
          />

          <span v-if="h3Enabled" class="h3-resolution-label">
            Resolution: {{ h3Resolution }}
          </span>
        </div>

        <q-form class="h3-lookup-row" @submit.prevent="submitH3CellLookup">
          <q-input
            v-model="h3CellInput"
            dense
            label="H3 cell ID"
            outlined
            spellcheck="false"
          />
          <q-btn color="primary" dense label="Go" no-caps type="submit" />
        </q-form>

        <q-form class="h3-lookup-row" @submit.prevent="submitLatLngLookup">
          <q-input
            v-model="latLngInput"
            dense
            label="latitude,longitude"
            outlined
            placeholder="13.736717,100.523186"
            spellcheck="false"
          />
          <q-btn color="primary" dense label="Go" no-caps type="submit" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { Notify } from "quasar";
import { ref } from "vue";

import { useMapLibreMap } from "@/composables/useMapLibreMap";

const mapContainer = ref<HTMLDivElement | null>(null);
const { h3Enabled, h3Resolution, jumpToH3Cell, jumpToLatLng } =
  useMapLibreMap(mapContainer);
const h3CellInput = ref("");
const latLngInput = ref("");

function submitH3CellLookup() {
  if (jumpToH3Cell(h3CellInput.value)) {
    return;
  }

  Notify.create({
    message: "Enter a valid H3 cell ID.",
    position: "bottom",
    type: "negative"
  });
}

function submitLatLngLookup() {
  const coordinates = parseLatLngInput(latLngInput.value);

  if (!coordinates) {
    Notify.create({
      message: "Enter coordinates as latitude,longitude.",
      position: "bottom",
      type: "negative"
    });
    return;
  }

  const h3Cell = jumpToLatLng(coordinates.latitude, coordinates.longitude);

  if (!h3Cell) {
    Notify.create({
      message: "Latitude must be -90 to 90 and longitude must be -180 to 180.",
      position: "bottom",
      type: "negative"
    });
    return;
  }

  h3CellInput.value = h3Cell;
}

function parseLatLngInput(value: string) {
  const [latitude, longitude, extra] = value
    .split(",")
    .map(part => Number(part.trim()));

  if (
    extra !== undefined ||
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return undefined;
  }

  return { latitude, longitude };
}
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

.h3-panel {
  left: 16px;
  max-width: calc(100% - 32px);
  position: absolute;
  top: 16px;
  width: 260px;
  z-index: 1;
}

.h3-lookup-row {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
}

.h3-lookup-row .q-btn {
  min-width: 48px;
}

.h3-toggle-row {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.h3-resolution-label {
  color: #666666;
  flex: 1;
  font-size: 12px;
  letter-spacing: 0.02em;
  text-align: right;
}
</style>
