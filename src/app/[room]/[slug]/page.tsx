import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import BookCover from "@/components/BookCover";
import { mdxComponents } from "@/components/mdx/MdxComponents";
import { KIND_LABELS, formatDate } from "@/lib/format";
import { getPost, postsInRoom } from "@/lib/posts";
import { ROOMS, SITE_URL, openRooms, type RoomId } from "@/lib/rooms";

interface PostProps {
  params: Promise<{ room: string; slug: string }>;
}

// Fully static: every post is pre-rendered at build; unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return openRooms().flatMap((room) => postsInRoom(room.id).map(({ meta }) => ({ room: room.id, slug: meta.slug })));
}

async function load(params: PostProps["params"]) {
  const { room, slug } = await params;
  const post = ROOMS[room as RoomId] && getPost(room as RoomId, slug);
  if (!post) notFound();
  return post;
}

export async function generateMetadata({ params }: PostProps): Promise<Metadata> {
  const { meta } = await load(params);
  const url = `${SITE_URL}/${meta.room}/${meta.slug}`;
  return {
    title: `${meta.title} | Scary Prankster`,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: url },
    robots: meta.isDraft ? { index: false, follow: false } : undefined,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      type: "article",
      siteName: "Scary Prankster",
      publishedTime: meta.publishedDate,
      modifiedTime: meta.modifiedDate,
      authors: ["Jay Long"],
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
  };
}

export default async function PostPage({ params }: PostProps) {
  const { meta, body, readingMinutes } = await load(params);
  const room = ROOMS[meta.room];
  const url = `${SITE_URL}/${meta.room}/${meta.slug}`;

  const shelf = postsInRoom(meta.room);
  const index = shelf.findIndex((p) => p.meta.slug === meta.slug);
  const newer = index > 0 ? shelf[index - 1].meta : null;
  const older = index < shelf.length - 1 ? shelf[index + 1].meta : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: meta.publishedDate,
    dateModified: meta.modifiedDate,
    author: { "@type": "Person", name: "Jay Long" },
    publisher: { "@type": "Organization", name: "Scary Prankster", url: SITE_URL },
    articleSection: room.shelf,
    keywords: meta.keywords ?? meta.tags ?? [],
    inLanguage: "en-US",
    ...(meta.headerImage ? { image: `${SITE_URL}${meta.headerImage}` } : {}),
    ...(meta.work
      ? {
          about: {
            "@type": meta.room === "books" ? "Book" : "CreativeWork",
            name: meta.work.title,
            ...(meta.work.creator ? { author: { "@type": "Person", name: meta.work.creator } } : {}),
            ...(meta.work.year ? { datePublished: String(meta.work.year) } : {}),
          },
        }
      : {}),
  };

  return (
    <div className="reading-room">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="room-head">
        <Link href={`/${room.id}`} className="room-crumb">
          <span className="status-lamp" /> SCARY PRANKSTER <span className="status-divider">/</span> {room.shelf}
        </Link>
      </header>

      <article className="page">
        {meta.isDraft && <p className="draft-banner">Draft. Visible in previews only, never in production.</p>}

        <div className="page-plate">
          {meta.headerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.headerImage} alt={meta.headerImageAlt} />
          ) : (
            <BookCover title={meta.work?.title ?? meta.title} creator={meta.work?.creator} className="cover" />
          )}
        </div>

        <p className="page-kicker">
          {KIND_LABELS[meta.kind]}
          {meta.work && (
            <>
              {" · "}
              <cite>{meta.work.title}</cite>
              {meta.work.creator && `, ${meta.work.creator}`}
              {meta.work.year && ` (${meta.work.year})`}
            </>
          )}
        </p>
        <h1>{meta.title}</h1>
        <p className="page-meta">
          <time dateTime={meta.publishedDate}>{formatDate(meta.publishedDate)}</time> · {readingMinutes} min read
          {meta.modifiedDate !== meta.publishedDate && (
            <>
              {" · updated "}
              <time dateTime={meta.modifiedDate}>{formatDate(meta.modifiedDate)}</time>
            </>
          )}
        </p>

        <div className="page-body">
          <MDXRemote source={body} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>
      </article>

      <nav className="page-turn" aria-label="More from this shelf">
        {older ? <Link href={`/${room.id}/${older.slug}`}>&larr; {older.title}</Link> : <span />}
        {newer ? <Link href={`/${room.id}/${newer.slug}`}>{newer.title} &rarr;</Link> : <span />}
      </nav>
    </div>
  );
}
