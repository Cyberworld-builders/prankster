"use client";

import { useEffect, useRef } from "react";

interface AmbientSoundProps {
  enabled: boolean;
  src?: string;
}

export function AmbientSound({ enabled, src = "/media/ambient-room.mp3" }: AmbientSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15;
    }

    const audio = audioRef.current;

    if (enabled) {
      audio.play().catch(() => {
        // Autoplay blocked, that's fine—user hasn't interacted yet
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [enabled, src]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return null;
}
