"use client";

import { useRef, useState } from "react";
import type { Artifact } from "@/content/artifacts";
import { seekKey, useDialog } from "./useDialog";

interface TurntablePlayerProps {
  artifact: Artifact;
  onClose: () => void;
}

export function TurntablePlayer({ artifact, onClose }: TurntablePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(artifact.duration || 0);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100);
      setCurrentTime(audio.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  useDialog(containerRef, onClose, togglePlay);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="turntable-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Audio player: ${artifact.title}`}
      tabIndex={-1}
    >
      <div className="turntable-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="turntable-container">
        <div className="turntable-platter">
          <div
            className={`turntable-disc${isPlaying ? " is-spinning" : ""}`}
            aria-hidden="true"
          >
            <div className="turntable-label">
              <span className="turntable-label-title">{artifact.title}</span>
              {artifact.placeholder && (
                <span className="turntable-placeholder-text">PLACEHOLDER</span>
              )}
            </div>
          </div>
          <div className="turntable-tonearm" aria-hidden="true">
            <div className={`turntable-arm${isPlaying ? " is-playing" : ""}`} />
          </div>
        </div>
        <div className="turntable-controls">
          <button
            className="turntable-play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "▮▮" : "▶"}
          </button>
          <div
            className="turntable-progress"
            onClick={handleSeek}
            onKeyDown={(e) => seekKey(e, audioRef.current)}
            role="slider"
            aria-label="Audio progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          >
            <div
              className="turntable-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="turntable-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <audio
          ref={audioRef}
          src={artifact.src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          aria-label={artifact.title}
        />
        <button
          className="turntable-close"
          onClick={onClose}
          aria-label="Close audio player"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
