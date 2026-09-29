# Scary Prankster

A single scrolling storefront for video, records, and books. The counter and its three objects stay in frame while the shop around them changes. Picking up an object opens a small media experiment.

```bash
npm install
npm run dev
```

The three optimized WebP scenes in `public/scenes` are original project artwork generated for this prototype. They share one camera position and foreground so the store transition feels continuous. The artwork is roughly 640 KB total. The scene changes on scroll; the VHS, book, and record are transparent semantic buttons positioned over their photographed counterparts. The media interactions contain placeholder material until the content API exists.

Build with `npm run build`. This is an experiential prototype, not a finished content player.
