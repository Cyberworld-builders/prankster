"use client";

import { useEffect, useRef } from "react";

interface AmbientSoundProps {
  enabled: boolean;
  src?: string;
}

export function AmbientSound({ enabled, src = "/media/ambient-room.mp3" }: AmbientSoundProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.15;
    if (!enabled) {
      audio.pause();
      return;
    }

    // A saved "sound on" preference is restored before the visitor has
    // interacted, so the browser blocks play(). Retry on the first gesture.
    const retry = () => {
      audio.play().catch(() => {});
    };
    audio.play().catch(() => {
      window.addEventListener("pointerdown", retry, { once: true });
      window.addEventListener("keydown", retry, { once: true });
    });
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      audio.pause();
    };
  }, [enabled]);

  return <audio ref={audioRef} className="ambient-sound" src={src} loop preload="none" aria-hidden="true" />;
}
