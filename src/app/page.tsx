"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { getFirstArtifactForRoom, getArtifactById, type Artifact, type RoomId } from "@/content/artifacts";
import { VHSViewer } from "@/components/VHSViewer";
import { TurntablePlayer } from "@/components/TurntablePlayer";
import { SoundToggle } from "@/components/SoundToggle";
import { AmbientSound } from "@/components/AmbientSound";

type Room = "video" | "record" | "book";
type ArtifactRoom = RoomId; // rooms that have artifacts (video, record)

const rooms: Room[] = ["video", "record", "book"];
const names: Record<Room, string> = { video: "Tapes", record: "Records", book: "Books" };
const hashes: Record<Room, string> = { video: "video", record: "records", book: "books" };

const hotspotPositions: Record<Room, { left: number; width: number }> = {
  video: { left: 0.055, width: 0.25 },
  book: { left: 0.32, width: 0.21 },
  record: { left: 0.54, width: 0.43 },
};

function isPortraitMobile(): boolean {
  if (typeof window === "undefined") return false;
  const w = window.innerWidth;
  const h = window.innerHeight;
  return w <= 750 && h / w > 9 / 16;
}

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
    if (hasScrolledRef.current) {
      scrollToRoom(room, true);
    }
  }, [room, scrollToRoom]);

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

  const handleArtifactHotspotClick = (targetRoom: ArtifactRoom, e: React.MouseEvent) => {
    if (targetRoom === room) {
      e.preventDefault();
      const artifact = getFirstArtifactForRoom(targetRoom);
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
      default:
        return null;
    }
  };

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
          <a
            className={`hotspot hotspot-tape${room === "video" ? " is-here" : ""}`}
            href={`#${hashes.video}`}
            aria-current={room === "video" ? "page" : undefined}
            aria-label={room === "video" ? "Open the VHS tape" : "Go to Tapes"}
            onClick={(e) => handleArtifactHotspotClick("video", e)}
          >
            <span>Tapes</span>
          </a>
          <a className={`hotspot hotspot-book${room === "book" ? " is-here" : ""}`} href={room === "book" ? "/books" : `#${hashes.book}`}>
            <span>{room === "book" ? "Enter the library" : "Books"}</span>
          </a>
          <a
            className={`hotspot hotspot-record${room === "record" ? " is-here" : ""}`}
            href={`#${hashes.record}`}
            aria-current={room === "record" ? "page" : undefined}
            aria-label={room === "record" ? "Play the record" : "Go to Records"}
            onClick={(e) => handleArtifactHotspotClick("record", e)}
          >
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
        <SoundToggle onSoundChange={setSoundEnabled} />
        <AmbientSound enabled={soundEnabled && !activeArtifact} />
      </div>
      {showHint && <div className="scroll-hint">SWIPE</div>}
      {renderViewer()}
    </main>
  );
}
