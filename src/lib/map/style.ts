import { DARK, layers, LIGHT } from "@protomaps/basemaps";
import type { StyleSpecification, SymbolLayerSpecification } from "maplibre-gl";

import { MAP_GLYPHS_URL, MAP_SPRITE_URLS, PMTILES_URL } from "@/config/map";
import type { ThemeMode } from "@/config/theme";

function getMapLayers(
  flavor: typeof LIGHT,
  theme: ThemeMode
): StyleSpecification["layers"] {
  return layers("protomaps", flavor, { lang: "en" }).map(layer => {
    if (layer.id !== "pois") {
      return layer;
    }

    const poiLayer = layer as SymbolLayerSpecification;

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
        "icon-halo-color": theme === "dark" ? "#000000" : "#FFFFFF",
        "icon-halo-width": 1,
        "icon-opacity": 1
      }
    };
  });
}

export function getMapStyle(theme: ThemeMode): StyleSpecification {
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
    layers: getMapLayers(baseFlavor, theme)
  };
}
