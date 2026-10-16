"use client";

import { useEffect, useState, useCallback } from "react";
import { getFirstArtifactForRoom, getArtifactById, type Artifact } from "@/content/artifacts";
import { VHSViewer } from "@/components/VHSViewer";
import { TurntablePlayer } from "@/components/TurntablePlayer";
import { BookViewer } from "@/components/BookViewer";
import { SoundToggle } from "@/components/SoundToggle";
import { AmbientSound } from "@/components/AmbientSound";

type Room = "video" | "record" | "book";

const rooms: Room[] = ["video", "record", "book"];
const names: Record<Room, string> = { video: "Tapes", record: "Records", book: "Books" };
const hashes: Record<Room, string> = { video: "video", record: "records", book: "books" };

function parseHash(): { room: Room; artifactId: string | null } {
  if (typeof window === "undefined") return { room: "video", artifactId: null };
  const hash = window.location.hash.replace("#", "");
  const parts = hash.split("/");
  const roomPart = parts[0];
  const artifactPart = parts[1] || null;

  let room: Room = "video";
  if (roomPart === "records" || roomPart === "record") room = "record";
  else if (roomPart === "books" || roomPart === "book") room = "book";
  else if (roomPart === "video" || roomPart === "tapes") room = "video";

  return { room, artifactId: artifactPart };
}

function setHashForArtifact(room: Room, artifactId: string | null) {
  const roomHash = hashes[room];
  const newHash = artifactId ? `${roomHash}/${artifactId}` : roomHash;
  if (window.location.hash !== `#${newHash}`) {
    window.history.pushState(null, "", `#${newHash}`);
  }
}

function setHashForRoom(room: Room) {
  const newHash = hashes[room];
  if (window.location.hash !== `#${newHash}`) {
    window.history.pushState(null, "", `#${newHash}`);
  }
}

export default function Home() {
  const [room, setRoom] = useState<Room>("video");
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const openArtifact = useCallback((artifact: Artifact) => {
    setActiveArtifact(artifact);
    setHashForArtifact(artifact.room, artifact.id);
  }, []);

  const closeArtifact = useCallback(() => {
    setActiveArtifact(null);
    setHashForRoom(room);
  }, [room]);

  const syncFromHash = useCallback(() => {
    const { room: hashRoom, artifactId } = parseHash();
    setRoom(hashRoom);

    if (artifactId) {
      const artifact = getArtifactById(artifactId);
      if (artifact && artifact.room === hashRoom) {
        setActiveArtifact(artifact);
        return;
      }
    }
    setActiveArtifact(null);
  }, []);

  useEffect(() => {
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [syncFromHash]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleHotspotClick = (targetRoom: Room, e: React.MouseEvent | React.KeyboardEvent) => {
    if (targetRoom === room) {
      e.preventDefault();
      const artifact = getFirstArtifactForRoom(room);
      if (artifact) {
        openArtifact(artifact);
      }
    }
  };

  const handleHotspotKeyDown = (targetRoom: Room, e: React.KeyboardEvent) => {
    if (e.key === "Enter" && targetRoom === room) {
      e.preventDefault();
      const artifact = getFirstArtifactForRoom(room);
      if (artifact) {
        openArtifact(artifact);
      }
    }
  };

  const renderViewer = () => {
    if (!activeArtifact) return null;

    switch (activeArtifact.type) {
      case "video":
        return <VHSViewer artifact={activeArtifact} onClose={closeArtifact} />;
      case "audio":
        return <TurntablePlayer artifact={activeArtifact} onClose={closeArtifact} />;
      case "text":
        return <BookViewer artifact={activeArtifact} onClose={closeArtifact} />;
      default:
        return null;
    }
  };

  return (
    <main>
      <div className={`stage${prefersReducedMotion ? " reduced-motion" : ""}`}>
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
          <a
            className={`hotspot hotspot-tape${room === "video" ? " is-here" : ""}`}
            href={`#${hashes.video}`}
            aria-current={room === "video" ? "page" : undefined}
            aria-label={room === "video" ? "Open the VHS tape" : "Go to Tapes"}
            onClick={(e) => handleHotspotClick("video", e)}
            onKeyDown={(e) => handleHotspotKeyDown("video", e)}
          >
            <span>Tapes</span>
          </a>
          <a
            className={`hotspot hotspot-book${room === "book" ? " is-here" : ""}`}
            href={`#${hashes.book}`}
            aria-current={room === "book" ? "page" : undefined}
            aria-label={room === "book" ? "Open the book" : "Go to Books"}
            onClick={(e) => handleHotspotClick("book", e)}
            onKeyDown={(e) => handleHotspotKeyDown("book", e)}
          >
            <span>Books</span>
          </a>
          <a
            className={`hotspot hotspot-record${room === "record" ? " is-here" : ""}`}
            href={`#${hashes.record}`}
            aria-current={room === "record" ? "page" : undefined}
            aria-label={room === "record" ? "Play the record" : "Go to Records"}
            onClick={(e) => handleHotspotClick("record", e)}
            onKeyDown={(e) => handleHotspotKeyDown("record", e)}
          >
            <span>Records</span>
          </a>
        </div>
        <div className="film-grain" aria-hidden="true" />
        <div className="scene-status" aria-live="polite">
          <span className="status-lamp" /> SCARY PRANKSTER <span className="status-divider">/</span> {names[room]}
        </div>
        <SoundToggle onSoundChange={setSoundEnabled} />
        <AmbientSound enabled={soundEnabled} />
      </div>
      {renderViewer()}
    </main>
  );
}
