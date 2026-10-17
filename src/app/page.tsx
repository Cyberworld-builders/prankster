"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Room = "video" | "record" | "book";

const rooms: Room[] = ["video", "record", "book"];
const names: Record<Room, string> = { video: "Tapes", record: "Records", book: "Books" };
const hashes: Record<Room, string> = { video: "video", record: "records", book: "books" };

function roomFromHash(): Room {
  const hash = window.location.hash.replace("#", "");
  if (hash === "records" || hash === "record") return "record";
  if (hash === "books" || hash === "book") return "book";
  return "video";
}

export default function Home() {
  const [room, setRoom] = useState<Room>("video");

  useEffect(() => {
    const sync = () => setRoom(roomFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <main>
      <div className="stage">
        <div className="scene-frame">
          {rooms.map((id) => (
            <div
              key={id}
              className={`scene scene-${id}`}
              style={{ opacity: room === id ? 1 : 0 }}
              aria-hidden={room !== id}
            />
          ))}
          <div className="scene-shade" aria-hidden="true" />
          <div className="crt-life" style={{ opacity: room === "video" ? 1 : 0 }} aria-hidden="true" />
          <a className={`hotspot hotspot-tape${room === "video" ? " is-here" : ""}`} href={`#${hashes.video}`} aria-current={room === "video" ? "page" : undefined}>
            <span>Tapes</span>
          </a>
          <a className={`hotspot hotspot-book${room === "book" ? " is-here" : ""}`} href={room === "book" ? "/books" : `#${hashes.book}`}>
            <span>{room === "book" ? "Enter the library" : "Books"}</span>
          </a>
          <a className={`hotspot hotspot-record${room === "record" ? " is-here" : ""}`} href={`#${hashes.record}`} aria-current={room === "record" ? "page" : undefined}>
            <span>Records</span>
          </a>
        </div>
        <div className="film-grain" aria-hidden="true" />
        <div className="scene-status" aria-live="polite">
          <span className="status-lamp" /> SCARY PRANKSTER <span className="status-divider">/</span> {names[room]}
          {room === "book" && (
            <>
              <span className="status-divider">/</span>
              <Link href="/books" className="status-enter">Enter the library &rarr;</Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
