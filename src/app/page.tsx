"use client";

import { useEffect, useRef, useState } from "react";

type Room = "video" | "record" | "book";
const rooms: Room[] = ["video", "record", "book"];
const names: Record<Room, string> = { video: "VIDEO", record: "RECORDS", book: "BOOKS" };

export default function Home() {
  const journey = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Room | null>(null);
  const [playing, setPlaying] = useState(false);
  const [bookPage, setBookPage] = useState(0);
  const [tracking, setTracking] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduced(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!journey.current) return;
        const rect = journey.current.getBoundingClientRect();
        const available = Math.max(1, rect.height - window.innerHeight);
        setProgress(Math.max(0, Math.min(2, (-rect.top / available) * 2)));
      });
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", syncPreference);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (selected === "book" && event.key === "ArrowRight") setBookPage((page) => (page + 1) % 3);
      if (selected === "book" && event.key === "ArrowLeft") setBookPage((page) => (page + 2) % 3);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const active = rooms[Math.round(progress)];
  const goTo = (index: number) => {
    if (!journey.current) return;
    const distance = journey.current.offsetHeight - window.innerHeight;
    window.scrollTo({ top: journey.current.offsetTop + (index / 2) * distance, behavior: reduced ? "instant" : "smooth" });
  };
  const select = (room: Room) => {
    setPlaying(false);
    setTracking(0);
    setBookPage(0);
    setSelected(room);
  };

  return <main id="top">
    <div className="journey" ref={journey}>
      <div className="stage">
        <div className="scene-frame">
          {rooms.map((room, index) => <div
            key={room}
            className={`scene scene-${room}`}
            style={{ opacity: Math.max(0, Math.min(1, 1 - Math.abs(progress - index))) }}
            aria-hidden="true"
          />)}
          <div className="scene-shade" aria-hidden="true" />
          <div className="crt-life" style={{ opacity: Math.max(0, 1 - progress * 2) }} aria-hidden="true" />
          <button className="hotspot hotspot-tape" onClick={() => select("video")} aria-label="Pick up the VHS tape"><span>THE TAPE <b>↗</b></span></button>
          <button className="hotspot hotspot-book" onClick={() => select("book")} aria-label="Pick up the book"><span>THE BOOK <b>↗</b></span></button>
          <button className="hotspot hotspot-record" onClick={() => select("record")} aria-label="Pick up the record"><span>THE RECORD <b>↗</b></span></button>
        </div>
        <div className="film-grain" aria-hidden="true" />
        <div className="scene-status" aria-live="polite"><span className="status-lamp" /> SCARY PRANKSTER <span className="status-divider">/</span> {names[active]}</div>
        <div className="scroll-cue">{progress < 1.85 ? "SCROLL TO WANDER" : "YOU CAN GO BACK"}<span>↓</span></div>
        <nav className="room-nav" aria-label="Store rooms">
          {rooms.map((room, index) => <button key={room} onClick={() => goTo(index)} className={active === room ? "active" : ""} aria-label={`Go to ${room} shop`} aria-current={active === room ? "step" : undefined}><span>{names[room]}</span><i /></button>)}
        </nav>
        <div className="progress-track" aria-hidden="true"><i style={{ height: `${progress * 50}%` }} /></div>
      </div>
    </div>
    <div className="afterword"><span>THE COUNTER IS STILL THERE.</span><button onClick={() => goTo(0)}>BACK TO THE BEGINNING ↑</button></div>

    {selected && <div className="experience" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section className={`experience-panel experience-${selected}`} role="dialog" aria-modal="true" aria-label={`The ${selected}`}>
        <button className="put-back" onClick={() => setSelected(null)}>PUT IT BACK <span>×</span></button>
        <div className="experience-art">
          {selected === "video" && <div className={`player-tv ${playing ? "is-playing" : ""}`} style={{ "--tracking": tracking } as React.CSSProperties}><div className="player-screen"><span className="screen-flare" /><span className="screen-noise" /><span className="screen-caption">{playing ? "NO SIGNAL" : "STOP"}</span></div><div className="player-controls"><button onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ PAUSE" : "▶ PLAY"}</button><button onClick={() => setTracking((value) => (value + 1) % 4)}>TRACKING +</button><span>00:00:{String(tracking).padStart(2, "0")}</span></div></div>}
          {selected === "record" && <div className="turntable"><div className={`platter ${playing ? "spinning" : ""}`}><div className="center-label"><i /></div></div><div className={`tonearm ${playing ? "on-record" : ""}`} /><div className="vu"><i className={playing ? "alive" : ""} /><i className={playing ? "alive" : ""} /><i className={playing ? "alive" : ""} /></div><button onClick={() => setPlaying(!playing)}>{playing ? "LIFT THE NEEDLE" : "DROP THE NEEDLE"}</button></div>}
          {selected === "book" && <div className="open-book"><div className="paper left-page"><small>PROPERTY OF THE SHOP</small><span className="page-rule" /><span className="page-rule" /><span className="page-rule" /><span className="page-mark">{bookPage + 1}</span></div><div className="paper right-page"><p>{["The first page has been removed.", "Something was pressed between these pages. The outline remains.", "There is a date in the margin. It has not happened yet."][bookPage]}</p><span className="page-mark">{bookPage + 2}</span></div><button className="turn-page" onClick={() => setBookPage((page) => (page + 1) % 3)} aria-label="Turn page">→</button></div>}
        </div>
        <div className="experience-caption"><small>{selected === "video" ? "UNLABELED / RENTAL COPY" : selected === "record" ? "UNMARKED / SIDE A" : "NO TITLE / NO AUTHOR"}</small><h2>{selected === "video" ? "The tape" : selected === "record" ? "The record" : "The book"}</h2><p>{selected === "video" ? "The machine remembers a picture. The tape hasn't offered one yet." : selected === "record" ? "The booth is live. The record has no sound here yet." : "Somebody checked this out. Nobody signed it back in."}</p><div className="not-yet">A PLACEHOLDER FOR WHAT COMES NEXT <span>✳</span></div></div>
      </section>
    </div>}
  </main>;
}
