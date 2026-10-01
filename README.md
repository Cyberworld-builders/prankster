# Scary Prankster

A single storefront for video, records, and books. The counter stays in frame. The tape, the book, and the record are links into their rooms, and the shop behind them changes.

```bash
npm install
npm run dev
```

The three shop photographs in `public/scenes` share one camera so the store transition feels continuous. The VHS, book, and record sit on the counter, and each one is a link. `#video`, `#records`, and `#books` select the room. Content for what you find inside an object comes later.

Build with `npm run build`. This is an experiential prototype, not a finished content player.
