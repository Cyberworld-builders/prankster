import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { ROOMS, type RoomId } from "./rooms";

/**
 * Posts live as MDX files in content/<room>/<slug>.mdx: YAML frontmatter
 * (validated below) followed by a markdown body. The directory is the room.
 * Everything here runs at build time; there is no index to keep in sync.
 */
export const CONTENT_DIR = path.join(process.cwd(), "content");

export const KINDS = ["dig", "what-if", "original", "find"] as const;
export type Kind = (typeof KINDS)[number];

/** The real work a post is about. Required for digs and what-ifs. */
export interface Work {
  title: string;
  creator?: string;
  year?: number;
}

/**
 * How a locator ref is read: dotted segments, with a range allowed in the last
 * one. `chapter` takes `2` or `volume.chapter` (`2.2`).
 */
export const LOCATOR_SCHEMES = {
  chapter: [1, 2],
  "act.scene.line": [3, 3],
  "stanza.line": [2, 2],
  line: [1, 1],
  "book.chapter.verse": [3, 3],
  "book.section": [2, 2],
  "section.paragraph": [2, 2],
} as const;
export type LocatorScheme = keyof typeof LOCATOR_SCHEMES;

export const RIGHTS = ["public-domain", "copyrighted", "unknown"] as const;
export type Rights = (typeof RIGHTS)[number];

/** One passage of `work`, quoted in the post body with <Passage>. */
export interface Fragment {
  locator: { scheme: LocatorScheme; ref: string; label?: string };
  edition: string;
  sourceUrl: string;
  rights: Rights;
  translator?: string;
  rightsNote?: string;
}

export interface PostMeta {
  title: string;
  description: string;
  slug: string;
  room: RoomId;
  kind: Kind;
  publishedDate: string;
  modifiedDate: string;
  work?: Work;
  fragment?: Fragment;
  headerImage?: string;
  headerImageAlt?: string;
  tags?: string[];
  keywords?: string[];
  isDraft?: boolean;
}

export interface Post {
  meta: PostMeta;
  body: string;
  readingMinutes: number;
}

const STRING_FIELDS = ["title", "description", "slug", "publishedDate", "modifiedDate", "headerImage", "headerImageAlt"];
const LIST_FIELDS = ["tags", "keywords"];
const REQUIRED_FIELDS = ["title", "description", "slug", "publishedDate", "kind"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// YAML parses an unquoted 2026-03-08 as a Date; normalize back to the string form.
function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function validateWork(value: unknown, errors: string[]): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push("work must be a mapping with title, creator, year");
    return;
  }
  const work = value as Record<string, unknown>;
  for (const key of Object.keys(work)) {
    if (!["title", "creator", "year"].includes(key)) errors.push(`unknown field work.${key}`);
  }
  if (typeof work.title !== "string" || !work.title) errors.push("work.title is required");
  if (work.creator !== undefined && typeof work.creator !== "string") errors.push("work.creator must be a string");
  if (work.year !== undefined && !Number.isInteger(work.year)) errors.push("work.year must be a whole number");
}

function isMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateFragment(value: unknown, errors: string[]): void {
  if (!isMapping(value)) {
    errors.push("fragment must be a mapping with locator, edition, sourceUrl, rights");
    return;
  }
  for (const key of Object.keys(value)) {
    if (!["locator", "edition", "sourceUrl", "rights", "translator", "rightsNote"].includes(key)) errors.push(`unknown field fragment.${key}`);
  }

  const locator = value.locator;
  if (!isMapping(locator)) {
    errors.push("fragment.locator must be a mapping with scheme and ref");
  } else {
    for (const key of Object.keys(locator)) {
      if (!["scheme", "ref", "label"].includes(key)) errors.push(`unknown field fragment.locator.${key}`);
    }
    const scheme = locator.scheme as LocatorScheme;
    const ref = locator.ref;
    if (!(scheme in LOCATOR_SCHEMES)) {
      errors.push(`fragment.locator.scheme must be one of ${Object.keys(LOCATOR_SCHEMES).join(", ")}`);
    } else if (typeof ref !== "string" || !ref) {
      errors.push('fragment.locator.ref is required; quote it ("5.5.19-28")');
    } else {
      const [min, max] = LOCATOR_SCHEMES[scheme];
      const segments = ref.split(".");
      if (segments.length < min || segments.length > max || segments.some((s) => !s)) {
        errors.push(`fragment.locator.ref "${ref}" doesn't fit scheme ${scheme}`);
      }
    }
    if (locator.label !== undefined && typeof locator.label !== "string") errors.push("fragment.locator.label must be a string");
  }

  if (typeof value.edition !== "string" || !value.edition) errors.push("fragment.edition is required");
  if (typeof value.sourceUrl !== "string" || !value.sourceUrl.startsWith("https://")) errors.push("fragment.sourceUrl must be an https:// URL");
  if (!RIGHTS.includes(value.rights as Rights)) errors.push(`fragment.rights must be one of ${RIGHTS.join(", ")}`);
  for (const key of ["translator", "rightsNote"]) {
    if (value[key] !== undefined && typeof value[key] !== "string") errors.push(`fragment.${key} must be a string`);
  }
}

function validate(room: RoomId, file: string, data: Record<string, unknown>): PostMeta {
  const errors: string[] = [];
  const meta: Record<string, unknown> = { room };

  for (const key of Object.keys(data)) {
    const value = normalizeValue(data[key]);
    if (STRING_FIELDS.includes(key)) {
      if (typeof value !== "string") errors.push(`${key} must be a string`);
    } else if (LIST_FIELDS.includes(key)) {
      if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) errors.push(`${key} must be a list of strings`);
    } else if (key === "isDraft") {
      if (typeof value !== "boolean") errors.push("isDraft must be true or false");
    } else if (key === "kind") {
      if (!KINDS.includes(value as Kind)) errors.push(`kind must be one of ${KINDS.join(", ")}`);
    } else if (key === "work") {
      validateWork(value, errors);
    } else if (key === "fragment") {
      validateFragment(value, errors);
    } else {
      errors.push(`unknown field ${key}`);
    }
    meta[key] = value;
  }

  for (const key of REQUIRED_FIELDS) {
    if (!meta[key]) errors.push(`${key} is required`);
  }
  // A what-if has to name the real work so the alternate stays distinct from canon.
  if ((meta.kind === "dig" || meta.kind === "what-if") && !meta.work) {
    errors.push(`work is required for a ${meta.kind}`);
  }
  if (meta.fragment && !meta.work) errors.push("work is required with fragment");
  if (meta.headerImage && !meta.headerImageAlt) errors.push("headerImageAlt is required with headerImage");
  const expectedSlug = path.basename(file, ".mdx");
  if (meta.slug && meta.slug !== expectedSlug) errors.push(`slug "${meta.slug}" must match the filename "${expectedSlug}"`);
  for (const key of ["publishedDate", "modifiedDate"]) {
    if (meta[key] && !DATE_RE.test(meta[key] as string)) errors.push(`${key} must be YYYY-MM-DD`);
  }

  if (errors.length) {
    throw new Error(`Invalid frontmatter in content/${room}/${file}:\n  - ${errors.join("\n  - ")}`);
  }
  if (!meta.modifiedDate) meta.modifiedDate = meta.publishedDate;
  return meta as unknown as PostMeta;
}

function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/<[^>]+>/g, " ")
    .replace(/\]\([^)]*\)/g, " ")
    .replace(/[#>*_`[\]\\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/**
 * Drafts are visible in local builds and Vercel previews so Jay can read them
 * in place, and never in the production deployment.
 */
export const SHOW_DRAFTS = process.env.VERCEL_ENV !== "production";

let cache: Post[] | null = null;

/** Every visible post in every room, newest first. */
export function loadPosts(): Post[] {
  if (cache) return cache;

  const posts: Post[] = [];
  for (const room of Object.keys(ROOMS) as RoomId[]) {
    const dir = path.join(CONTENT_DIR, room);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort()) {
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const meta = validate(room, file, data);
      if (meta.isDraft && !SHOW_DRAFTS) continue;
      posts.push({ meta, body: content, readingMinutes: readingMinutes(content) });
    }
  }

  posts.sort((a, b) => b.meta.publishedDate.localeCompare(a.meta.publishedDate) || a.meta.slug.localeCompare(b.meta.slug));
  cache = posts;
  return posts;
}

/** Posts on one shelf. Closed rooms have no pages, so their posts stay off the site. */
export function postsInRoom(room: RoomId): Post[] {
  if (!ROOMS[room].open) return [];
  return loadPosts().filter((post) => post.meta.room === room);
}

export function getPost(room: RoomId, slug: string): Post | undefined {
  return postsInRoom(room).find((post) => post.meta.slug === slug);
}
