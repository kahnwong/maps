import { DARK, layers, LIGHT } from "@protomaps/basemaps";
import {
  MAP_GLYPHS_URL,
  MAP_SPRITE_URLS,
  PMTILES_URL
} from "../../config/map.js";

export function getMapStyle(theme) {
  return {
    version: 8,
    glyphs: MAP_GLYPHS_URL,
    sprite: MAP_SPRITE_URLS[theme],
    sources: { protomaps: { type: "vector", url: `pmtiles://${PMTILES_URL}` } },
    layers: layers("protomaps", theme === "dark" ? DARK : LIGHT, {
      lang: "en"
    }).map(layer => {
      if (layer.id !== "pois") return layer;
      return {
        ...layer,
        layout: {
          ...layer.layout,
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
          ...layer.paint,
          "icon-halo-color": theme === "dark" ? "#000000" : "#FFFFFF",
          "icon-halo-width": 1,
          "icon-opacity": 1
        }
      };
    })
  };
}
