import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookCover from "@/components/BookCover";
import { KIND_LABELS, formatDate } from "@/lib/format";
import { postsInRoom } from "@/lib/posts";
import { ROOMS, SITE_URL, openRooms, type RoomId } from "@/lib/rooms";

interface ShelfProps {
  params: Promise<{ room: string }>;
}

// Fully static: only open rooms get a page; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return openRooms().map((room) => ({ room: room.id }));
}

function roomOrNotFound(id: string) {
  const room = ROOMS[id as RoomId];
  if (!room?.open) notFound();
  return room;
}

export async function generateMetadata({ params }: ShelfProps): Promise<Metadata> {
  const room = roomOrNotFound((await params).room);
  const url = `${SITE_URL}/${room.id}`;
  return {
    title: `${room.shelf} | Scary Prankster`,
    description: room.blurb,
    alternates: { canonical: url },
    openGraph: { title: room.shelf, description: room.blurb, url, siteName: "Scary Prankster", type: "website" },
  };
}

export default async function Shelf({ params }: ShelfProps) {
  const room = roomOrNotFound((await params).room);
  const posts = postsInRoom(room.id);

  return (
    <div className="reading-room">
      <header className="room-head">
        <Link href={`/#${room.id}`} className="room-crumb">
          <span className="status-lamp" /> SCARY PRANKSTER <span className="status-divider">/</span> {room.name}
        </Link>
        <h1>{room.shelf}</h1>
        <p>{room.blurb}</p>
      </header>

      {posts.length === 0 ? (
        <p className="shelf-empty">Nothing on the shelf yet.</p>
      ) : (
        <ol className="shelf">
          {posts.map(({ meta, readingMinutes }) => (
            <li key={meta.slug}>
              <Link href={`/${room.id}/${meta.slug}`} className="shelf-item">
                <BookCover title={meta.work?.title ?? meta.title} creator={meta.work?.creator} className="shelf-cover" />
                <div>
                  <p className="shelf-kicker">
                    {KIND_LABELS[meta.kind]}
                    {meta.isDraft && <span className="draft-tag">Draft</span>}
                  </p>
                  <h2>{meta.title}</h2>
                  <p className="shelf-desc">{meta.description}</p>
                  <p className="shelf-meta">
                    {formatDate(meta.publishedDate)} · {readingMinutes} min
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
