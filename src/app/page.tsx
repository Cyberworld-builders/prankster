"use client";

import { useEffect, useRef, useState } from "react";

type Room = "video" | "record" | "book";
const rooms: Room[] = ["video", "record", "book"];
const snippets = {
  video: { heading: "A tape with no title", detail: "The tracking slips. For a moment, something moves behind the snow.", meta: "RETURN BEFORE THE LIGHTS COME ON" },
  record: { heading: "An unmarked pressing", detail: "A room tone, a count-in, then the recording cuts away.", meta: "SIDE A · NO CATALOG NUMBER" },
  book: { heading: "A book somebody borrowed", detail: "There are dates in the pocket. None of them are in order.", meta: "DUE DATE UNKNOWN" },
};

function VideoRoom() {
  return <div className="room room-video" aria-hidden="true">
    <div className="ceiling"><i /><i /><i /></div>
    <div className="back-wall"><div className="wall-stripe" /><div className="shop-sign"><span className="sign-mark">☠</span><span>SCARY<br />PRANKSTER</span><small>VIDEO · REPAIRS</small></div><div className="face-mural" /></div>
    <div className="shelf shelf-left">{Array.from({length: 42}, (_, i) => <i key={i} style={{"--n": i % 7} as React.CSSProperties} />)}</div>
    <div className="shelf shelf-right">{Array.from({length: 35}, (_, i) => <i key={i} style={{"--n": i % 8} as React.CSSProperties} />)}</div>
    <div className="work-door"><span>REPAIRS</span><div className="workbench"><b /><b /><b /></div></div>
    <div className="crt"><div className="crt-screen"><div className="crt-static" /></div><div className="crt-knob" /></div>
    <div className="floor" />
  </div>;
}
function RecordRoom() {
  return <div className="room room-record" aria-hidden="true">
    <div className="record-wall"><div className="record-poster poster-one">TONIGHT<br /><strong>NOISE</strong><br />DOWNSTAIRS</div><div className="record-poster poster-two">LOCAL<br />FREQUENCY<br /><strong>89.7</strong></div><div className="flyer-stack"><i /><i /><i /></div></div>
    <div className="record-sign">SCARY PRANKSTER <small>RECORDS & RADIO</small></div>
    <div className="record-bin bin-left">{Array.from({length: 10},(_,i)=><i key={i} style={{"--n":i} as React.CSSProperties}/>)}</div>
    <div className="record-bin bin-right">{Array.from({length: 10},(_,i)=><i key={i} style={{"--n":i} as React.CSSProperties}/>)}</div>
    <div className="booth"><div className="on-air">ON AIR</div><div className="booth-glass"><div className="mic" /><div className="console" /></div></div>
    <div className="lava"><i /></div><div className="record-floor" />
  </div>;
}
function BookRoom() {
  return <div className="room room-book" aria-hidden="true">
    <div className="book-wall"><div className="book-sign">SCARY PRANKSTER <small>BOOKS · MAPS · ODDITIES</small></div></div>
    <div className="bookshelf books-left">{Array.from({length: 56},(_,i)=><i key={i} style={{"--n":i%9} as React.CSSProperties}/>)}</div>
    <div className="bookshelf books-right">{Array.from({length: 48},(_,i)=><i key={i} style={{"--n":i%11} as React.CSSProperties}/>)}</div>
    <div className="stairwell"><div className="attic-dark" /><div className="stairs">{Array.from({length:7},(_,i)=><i key={i}/>)}</div><span>PRIVATE</span></div>
    <div className="lamp"><i /><b /></div><div className="book-floor" />
  </div>;
}

export default function Home() {
  const journey = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState<Room | null>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const change = () => setReduced(mq.matches);
    mq.addEventListener("change", change);
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!journey.current) return;
        const rect = journey.current.getBoundingClientRect();
        setProgress(Math.max(0, Math.min(2, -rect.top / Math.max(1, rect.height - window.innerHeight) * 2)));
      });
    };
    update(); window.addEventListener("scroll", update, {passive:true}); window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); mq.removeEventListener("change",change); window.removeEventListener("scroll",update); window.removeEventListener("resize",update); };
  }, []);
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    document.addEventListener("keydown",onKey);
    return () => document.removeEventListener("keydown",onKey);
  },[selected]);
  const active = rooms[Math.round(progress)];
  const opacity = (index:number) => Math.max(0, 1 - Math.abs(progress - index));
  return <main>
    <div className="journey" ref={journey}>
      <div className="stage" style={{"--journey":progress} as React.CSSProperties}>
        <div className="room-layer" style={{opacity:opacity(0)}}><VideoRoom /></div>
        <div className="room-layer" style={{opacity:opacity(1)}}><RecordRoom /></div>
        <div className="room-layer" style={{opacity:opacity(2)}}><BookRoom /></div>
        <div className="room-vignette" aria-hidden="true" />
        <div className="dust" aria-hidden="true" />
        <div className="counter">
          <div className="counter-back" />
          <div className="counter-top"><span className="counter-scratch scratch-one"/><span className="counter-scratch scratch-two"/></div>
          <div className="objects" role="group" aria-label="Objects on the counter">
            <button className={`artifact tape ${active === "video" ? "in-focus" : ""}`} onClick={()=>setSelected("video")} aria-label="Pick up the VHS tape"><span className="tape-shell"><span className="tape-label"/><span className="tape-window"><i/><i/></span><span className="tape-screws">✦　　　　　　 ✦</span></span></button>
            <button className={`artifact book-object ${active === "book" ? "in-focus" : ""}`} onClick={()=>setSelected("book")} aria-label="Pick up the book"><span className="book-cover"><span className="book-wear"/><span className="book-pocket"><i/></span></span><span className="book-pages"/></button>
            <button className={`artifact vinyl ${active === "record" ? "in-focus" : ""}`} onClick={()=>setSelected("record")} aria-label="Pick up the record"><span className="record-edge"/><span className="record-sleeve"><span className="sleeve-ring"/><span className="sleeve-hole"/></span></button>
          </div>
          <div className="counter-front"><div className="counter-note">PLEASE RETURN WHAT YOU FOUND.<br />WE KNOW WHAT YOU TOOK.</div><span className="counter-drawer"/></div>
        </div>
        <div className="edge-grain" aria-hidden="true" />
        <div className="corner-caption" aria-live="polite"><span className="caption-line" />{active === "video" ? "AFTER HOURS · VIDEO" : active === "record" ? "AFTER HOURS · RECORDS" : "AFTER HOURS · BOOKS"}</div>
        <div className="scroll-hint" aria-hidden="true">SCROLL TO WANDER <span>↓</span></div>
        <div className="chapter-dots" aria-label="Choose a room">{rooms.map((room,i)=><button key={room} className={active===room?"current":""} onClick={()=>{const target = journey.current; if(target) window.scrollTo({top: target.offsetTop + i*(target.offsetHeight-window.innerHeight)/2,behavior:reduced?"instant":"smooth"});}} aria-label={`Go to ${room} store`} aria-current={active===room?"step":undefined}/>)}</div>
      </div>
    </div>
    <footer className="endnote">THE LIGHTS ARE STILL ON. <a href="#top" onClick={(e)=>{e.preventDefault();window.scrollTo({top:0,behavior:reduced?"instant":"smooth"});}}>GO BACK INSIDE ↑</a></footer>
    {selected && <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelected(null)}}><section className={`media-modal modal-${selected}`} role="dialog" aria-modal="true" aria-labelledby="media-title"><button className="close-modal" onClick={()=>setSelected(null)} aria-label="Put object back">PUT IT BACK ×</button><div className="media-visual" aria-hidden="true">{selected==="video"?<div className="preview-tv"><div className="preview-snow"/></div>:selected==="record"?<div className="preview-record"><i/></div>:<div className="preview-pages"><i/><i/><i/></div>}</div><div className="media-copy"><small>{snippets[selected].meta}</small><h2 id="media-title">{snippets[selected].heading}</h2><p>{snippets[selected].detail}</p><span>There is more here. Just not yet.</span></div></section></div>}
  </main>;
}
