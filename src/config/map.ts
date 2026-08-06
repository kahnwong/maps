export const PMTILES_URL = "https://pmtiles.karnwong.me/thailand.pmtiles";
export const MAP_GLYPHS_URL =
  "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf";
export const MAP_SPRITE_URLS = {
  light: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
  dark: "https://protomaps.github.io/basemaps-assets/sprites/v4/dark"
};
export const MAP_CENTER: [number, number] = [100.523186, 13.736717];
export const MAP_ZOOM = 9;

export const H3_OVERLAY_COLORS = {
  fill: {
    light: "#1565C0",
    dark: "#64B5F6"
  },
  line: {
    light: "#004D40",
    dark: "#90CAF9"
  },
  text: {
    light: "#0D47A1",
    dark: "#FFFFFF"
  },
  textHalo: {
    light: "#FFFFFF",
    dark: "#000000"
  }
} as const;
