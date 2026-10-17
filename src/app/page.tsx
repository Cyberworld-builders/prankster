"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type Room = "video" | "record" | "book";

const rooms: Room[] = ["video", "record", "book"];
const names: Record<Room, string> = { video: "Tapes", record: "Records", book: "Books" };
const hashes: Record<Room, string> = { video: "video", record: "records", book: "books" };

const hotspotPositions: Record<Room, { left: number; width: number }> = {
  video: { left: 0.055, width: 0.25 },
  book: { left: 0.32, width: 0.21 },
  record: { left: 0.54, width: 0.43 },
};

function roomFromHash(): Room {
  const hash = window.location.hash.replace("#", "").split("/")[0];
  if (hash === "records" || hash === "record") return "record";
  if (hash === "books" || hash === "book") return "book";
  return "video";
}

function isPortraitMobile(): boolean {
  if (typeof window === "undefined") return false;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return w <= 750 && h / w > 9 / 16;
}

export default function Home() {
  const [room, setRoom] = useState<Room>("video");
  const [showHint, setShowHint] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const scrollToRoom = useCallback((targetRoom: Room, smooth = false) => {
    const stage = stageRef.current;
    if (!stage || !isPortraitMobile()) return;

    const sceneFrame = stage.querySelector(".scene-frame") as HTMLElement;
    if (!sceneFrame) return;

    const frameWidth = sceneFrame.offsetWidth;
    const viewportWidth = stage.clientWidth;
    const pos = hotspotPositions[targetRoom];
    const hotspotCenter = (pos.left + pos.width / 2) * frameWidth;
    const targetScroll = Math.max(0, Math.min(hotspotCenter - viewportWidth / 2, frameWidth - viewportWidth));

    stage.scrollTo({ left: targetScroll, behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    const sync = () => {
      const newRoom = roomFromHash();
      setRoom(newRoom);
      if (hasScrolledRef.current) {
        scrollToRoom(newRoom, true);
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [scrollToRoom]);

  useEffect(() => {
    if (hasScrolledRef.current) return;

    const handleLoad = () => {
      if (!isPortraitMobile()) return;
      scrollToRoom(room, false);
      hasScrolledRef.current = true;
      setShowHint(true);
    };

    if (document.readyState === "complete") {
      requestAnimationFrame(handleLoad);
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, [room, scrollToRoom]);

  useEffect(() => {
    const handleResize = () => {
      if (isPortraitMobile() && !hasScrolledRef.current) {
        scrollToRoom(room, false);
        hasScrolledRef.current = true;
        setShowHint(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [room, scrollToRoom]);

  return (
    <main>
      <div className="stage" ref={stageRef}>
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
          <a className={`hotspot hotspot-book${room === "book" ? " is-here" : ""}`} href={`#${hashes.book}`} aria-current={room === "book" ? "page" : undefined}>
            <span>Books</span>
          </a>
          <a className={`hotspot hotspot-record${room === "record" ? " is-here" : ""}`} href={`#${hashes.record}`} aria-current={room === "record" ? "page" : undefined}>
            <span>Records</span>
          </a>
        </div>
        <div className="film-grain" aria-hidden="true" />
        <div className="scene-status" aria-live="polite">
          <span className="status-lamp" /> SCARY PRANKSTER <span className="status-divider">/</span> {names[room]}
        </div>
      </div>
      {showHint && <div className="scroll-hint">SWIPE</div>}
    </main>
  );
}
