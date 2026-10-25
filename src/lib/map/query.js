export function parseThemeQuery(value) {
  return value === "light" || value === "dark" ? value : undefined;
}

export function parseMapQuery(value) {
  if (typeof value !== "string") return undefined;
  const parts = value.split("/");
  if (parts.length !== 3 || parts.some(part => !part.trim())) return undefined;
  const [zoom, latitude, longitude] = parts.map(Number);
  if (
    ![zoom, latitude, longitude].every(Number.isFinite) ||
    zoom < 0 ||
    zoom > 24 ||
    latitude < -90 ||
    latitude > 90
  )
    return undefined;
  return { center: [longitude, latitude], zoom };
}

export function formatMapQuery(map) {
  const center = map.getCenter();
  return `${map.getZoom().toFixed(2)}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`;
}

export function parseLatLngInput(value) {
  const parts = value.split(",");
  if (parts.length !== 2 || parts.some(part => !part.trim())) return undefined;
  const [latitude, longitude] = parts.map(Number);
  if (![latitude, longitude].every(Number.isFinite)) return undefined;
  return { latitude, longitude };
}
