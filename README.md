# Scary Prankster

A single storefront for video, records, and books. The counter stays in frame. The tape, the book, and the record are links into their rooms, and the shop behind them changes.

```bash
npm install
npm run dev
```

The three shop photographs in `public/scenes` share one camera so the store transition feels continuous. The VHS, book, and record sit on the counter, and each one is a link. `#video`, `#records`, and `#books` select the room.

## Artifacts

Each room contains one openable artifact:

- **Tapes** (`#video`): Click the VHS to open a CRT-style video player with scanlines and static effects
- **Records** (`#records`): Click the record to open a turntable-style audio player with spinning disc
- **Books** (`#books`): Click the book to open a paper page overlay with the text

Artifacts are deep-linkable: `#video/placeholder-tape`, `#records/placeholder-track`, `#books/placeholder-story`.

### Adding Real Media

All artifacts are defined in `src/content/artifacts.ts`. To replace a placeholder:

1. **Add your media file** to the appropriate folder:
   - Video: `public/media/video/` (MP4 H.264 recommended, keep under 10MB)
   - Audio: `public/media/record/` (MP3 or OGG, keep under 5MB)
   - Text: `public/media/book/` (plain .txt file)

2. **Edit the manifest** in `src/content/artifacts.ts`:

```ts
{
  id: "my-tape",              // URL-safe ID, used in deep links
  room: "video",              // "video" | "record" | "book"
  type: "video",              // "video" | "audio" | "text"
  title: "My VHS Tape",       // Display title
  src: "/media/video/my-tape.mp4",
  poster: "/media/video/my-tape-poster.jpg",  // Optional poster image
  captions: "/media/video/my-tape.vtt",       // Optional WebVTT captions
  duration: 120,              // Optional, in seconds
  placeholder: false,         // Set false for real content
  description: "A real tape.",
}
```

3. **For video**, also add:
   - A poster image (`.jpg` or `.png`)
   - A captions file (`.vtt`) for accessibility

4. **Rebuild and test**:
```bash
npm run build
npm run start
```

### Ambient Sound

A subtle ambient room tone plays when enabled via the sound toggle (speaker icon, top-right). The preference is saved in localStorage. Ambient sound respects autoplay policies—it only plays after user interaction.

To customize ambient audio, replace `public/media/ambient-room.mp3`.

### Accessibility

- **Keyboard**: Enter/Space to play/pause, Escape to close overlays
- **Focus traps**: Overlays capture focus until closed
- **Captions**: Video supports WebVTT caption tracks
- **ARIA labels**: All interactive elements are labeled
- **Reduced motion**: Animations are disabled when `prefers-reduced-motion` is set

### File Size Guidelines

Keep media small for fast loading:
- Video: Under 10MB, use H.264 with CRF 28-32
- Audio: Under 2MB, use MP3 at 128kbps or lower
- Images: Under 200KB, use WebP or compressed JPEG

Build with `npm run build`. This is an experiential prototype, not a finished content player.
