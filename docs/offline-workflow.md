# Offline Workflow

Grid Studio is designed as a static PWA. No server is required for calculation,
preview, or SVG export.

## Local Use

```sh
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173/`.

## Production Check

```sh
npm run build
npm run preview
```

The build should generate:

- `dist/manifest.webmanifest`
- `dist/sw.js`
- `dist/registerSW.js`
- hashed CSS and JavaScript assets

After the production app is loaded once in a browser, the service worker can
serve the static shell offline. SVG exports are generated in-browser from the
selected grid values and do not require network access.
