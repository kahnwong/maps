import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Protocol } from "pmtiles";
import type { Ref } from "vue";
import { onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { MAP_CENTER, MAP_ZOOM } from "@/config/map";
import { themeMode } from "@/config/theme";
import {
  formatMapQuery,
  parseMapQuery,
  parseThemeQuery
} from "@/lib/map/query";
import { getMapStyle } from "@/lib/map/style";

export function useMapLibreMap(mapContainer: Ref<HTMLDivElement | null>) {
  const route = useRoute();
  const router = useRouter();
  let map: maplibregl.Map | undefined;
  let protocol: Protocol | undefined;
  let queryUpdateTimer: ReturnType<typeof setTimeout> | undefined;

  const initialTheme = parseThemeQuery(route.query.theme);
  if (initialTheme) {
    themeMode.value = initialTheme;
  }

  const initialMapView = parseMapQuery(route.query.map);

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

  function applyTheme() {
    map?.setStyle(getMapStyle(themeMode.value));
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
      style: getMapStyle(themeMode.value),
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
}
