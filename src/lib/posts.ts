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

export interface PostMeta {
  title: string;
  description: string;
  slug: string;
  room: RoomId;
  kind: Kind;
  publishedDate: string;
  modifiedDate: string;
  work?: Work;
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
