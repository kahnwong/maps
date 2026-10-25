# Maps

A static Thailand map viewer built with plain HTML, CSS, and vanilla JavaScript.
MapLibre renders the PMTiles basemap; h3-js provides the optional H3 grid.
No UI framework or backend is required. Vite bundles the map libraries and worker.

## Development

Use Node.js 22.12+, 24, or 26+ and Yarn.

```sh
yarn install --frozen-lockfile
yarn dev
```

## Checks and deployment

```sh
yarn test
yarn lint:check
yarn build
yarn preview
```

Deploy `dist/` to any static HTTP host (the Cloudflare Pages workflow does this).
Opening `index.html` directly with `file://` is not supported.

## Features

- Light/dark basemap toggle and map navigation controls.
- Shareable `?theme=dark&map=9.00/13.736717/100.523186` URLs
  (`zoom/latitude/longitude`); old `/#/?...` links are also accepted.
- H3 overlay with automatic resolution based on zoom; click a cell to copy its ID.
- Jump to an H3 cell or a `latitude,longitude` pair; coordinate lookup fills in the H3 ID.

Map endpoints and colors are configured in `src/config/map.js`. Tiles, fonts,
and sprites require network access. Clipboard access requires HTTPS or localhost
and browser permission. The existing analytics script loads in production only.
