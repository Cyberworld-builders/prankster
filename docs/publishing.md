# Publishing a post

How a post goes from a file to live on scaryprankster.com. Applies to any
agent, workflow, or human writing posts. The architecture is the same one
`Cyberworld-builders/legend` uses for the CyberWorld blog; the content and
the rules below are Prankster's.

## Architecture

```
content/<room>/<slug>.mdx   (source of truth: YAML frontmatter + markdown body)
  -> src/lib/posts.ts       (reads + validates every file at build time)
    -> next build           (pre-renders /<room>, /<room>/<slug>, OG images, sitemap)
      -> Vercel             (preview on any branch, production on main)
```

There is no database and no generated index. Adding a post is one new file in
one commit.

## Rooms

The directory a post sits in is its room, and the room is in its URL.
Rooms are defined in `src/lib/rooms.ts`.

| Room | Directory | URL | Status |
|---|---|---|---|
| The Library | `content/books/` | `/books/<slug>` | open |
| The Record Store | `content/records/` | `/records/<slug>` | closed |
| The Tape Store | `content/tapes/` | `/tapes/<slug>` | closed (video is tabled) |

A closed room has no pages. Posts filed there are validated but not published.

## Post format

```mdx
---
title: "Post Title Here"
description: "One or two sentences for search results and the shelf."
slug: post-title-here
kind: dig
work:
  title: Frankenstein
  creator: Mary Shelley
  year: 1818
publishedDate: "2026-10-09"
tags:
  - gothic
isDraft: true
---

Opening paragraph in plain markdown. It gets the drop cap.

## A section heading

Text with **bold**, *italics* and [links](https://example.com).

<Cover title="Frankenstein" creator="Mary Shelley" caption="Placeholder cover." />
```

### Frontmatter rules

`src/lib/posts.ts` validates every file during the build. A bad file fails the
build, and so the Vercel preview, with a message naming the file and field.

| Field | Required | Notes |
|---|---|---|
| `title`, `description` | yes | strings |
| `slug` | yes | must equal the filename without `.mdx` |
| `kind` | yes | `dig`, `what-if`, `original` or `find` |
| `work` | for `dig` and `what-if` | the real work: `title` (required), `creator`, `year`. A what-if must name it so the alternate stays distinct from canon |
| `publishedDate` | yes | `YYYY-MM-DD`; quote it |
| `modifiedDate` | no | `YYYY-MM-DD`; defaults to `publishedDate` |
| `fragment` | no | the passage a post quotes; needs `work`. See Fragments below |
| `headerImage`, `headerImageAlt` | no | path under `public/`; alt text is required with an image. Without one, a cover is generated from `work` or the title |
| `tags`, `keywords` | no | lists of strings |
| `isDraft` | no | `true`/`false` |

Any other field is rejected.

### Fragments

A fragment post quotes one contiguous passage of `work`, usually as a `find`
(a `dig` when the note around it becomes an essay). The frontmatter says where
the passage is; the passage itself goes in the body inside `<Passage>`, which
adds a citation line and a link to the full source.

```yaml
kind: find
work:
  title: Macbeth
  creator: William Shakespeare
fragment:
  locator:
    scheme: act.scene.line
    ref: "5.5.19-28"
  edition: "Project Gutenberg eBook #1533"
  sourceUrl: https://www.gutenberg.org/ebooks/1533
  rights: public-domain
```

```mdx
<Passage verse>
She should have died hereafter.
There would have been a time for such a word.
</Passage>
```

| Field | Required | Notes |
|---|---|---|
| `locator.scheme` | yes | how `ref` reads, below |
| `locator.ref` | yes | dotted segments, a range allowed in the last; quote it |
| `locator.label` | no | display text when the scheme can't say it ("Henry Jekyll's Full Statement, ¶2") |
| `edition` | yes | the exact text quoted from; line and verse numbers are relative to it |
| `sourceUrl` | yes | `https://` link to that edition |
| `rights` | yes | `public-domain`, `copyrighted` or `unknown`. A label, not a legal call |
| `translator`, `rightsNote` | no | strings |

| Scheme | Ref | Shown as |
|---|---|---|
| `chapter` | `2`, or `2.2` for volume.chapter | ch. 2 / vol. 2, ch. 2 |
| `act.scene.line` | `5.5.19-28` | 5.5.19–28 |
| `stanza.line` | `1.1-6` | st. 1, ll. 1–6 |
| `line` | `12-14` | ll. 12–14 |
| `book.chapter.verse` | `ecclesiastes.3.1-8` | Ecclesiastes 3:1–8 |
| `book.section` | `2.1` | II.1 |
| `section.paragraph` | `1.1` | §1 ¶1 |

Copy the passage verbatim from the cited edition, punctuation included. Use
`<Passage verse>` for verse so line breaks stay. A post's framing, title and
description are Jay's; until he writes them, leave `[JAY: …]` placeholders.

### Drafts

A draft is built and shown, with a banner and `noindex`, in local builds and
Vercel previews. The production deployment (`VERCEL_ENV=production`) leaves
it out. A post goes live when `isDraft` is removed and the change merges to
`main`. Nothing ships until Jay says the voice is ready.

### Media

Until real scans and photographs exist, posts use generated placeholder
media: the cover drawn by `src/components/BookCover.tsx`, available in a body
as `<Cover title creator caption />`. Real images go under
`public/images/<slug>/` and are used with `<Figure src alt caption />` or
`headerImage`. Other people's photographs, scans and stills are allowed (see
Copyright below).

### Copyright

Copyright is not a blocker. The site is Jay's own library of inspiration and
gets almost no traffic, so excerpts of copyrighted books, songs, stems, film
scenes, scans and stills are fine. If real traffic ever brings rights holders
who object, we'll work something out with them, or remove or gate the
material then.

Make that later step cheap: say where each excerpt comes from (edition,
album, or film and timestamp) and whether it is public domain or
copyrighted. For a quoted passage, that is the `fragment` field; for other
excerpts, until the frontmatter has a field for them, put it in the post
body.

### Body rules

- Write plain markdown with no classes or inline styles. All post styling
  lives under `.page` in `src/app/globals.css`.
- MDX treats `{`, `}`, `<` and `>` as syntax. Escape them with a backslash in
  prose (`\{`, `\<`).
- GitHub-flavored markdown (tables, strikethrough, autolinked URLs) is enabled.

## Publishing steps

1. Add `content/<room>/<slug>.mdx` with `isDraft: true`.
2. Check it with `npm run build`.
3. Push a branch and open a PR. Vercel posts a preview URL, and the draft is
   readable there.
4. Once Jay approves, remove `isDraft` and merge to `main`.

Editing a post is the same: change the file, bump `modifiedDate`, open a PR.
