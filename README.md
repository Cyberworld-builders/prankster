# Scary Prankster

An experimental, single-page storefront for video, music, and prose. The room changes as you scroll while the counter and its three objects stay in place. Each object opens a small, deliberately unfinished media teaser.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Build with `npm run build`.

## Frontend direction

This first pass tests physical presence and atmosphere. The three interiors are CSS scenery with one existing skull image, so there are no large background photographs or video downloads. The same counter persists through the video shop, record store, and bookstore. Clicking an object opens a placeholder for its medium; it does not yet request media from an API. Scrolling and room buttons offer the same path, with reduced-motion preferences respected.

The objects and fixtures are intentionally rough concept art in code. Media playback, content models, finalized copy, and production assets belong to later iterations after the arrival experience has been evaluated.
