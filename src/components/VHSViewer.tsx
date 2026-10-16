"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Artifact } from "@/content/artifacts";

interface VHSViewerProps {
  artifact: Artifact;
  onClose: () => void;
}

export function VHSViewer({ artifact, onClose }: VHSViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showStatic, setShowStatic] = useState(true);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const video = videoRef.current;
        if (video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    containerRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const staticTimer = setTimeout(() => setShowStatic(false), 800);
    return () => clearTimeout(staticTimer);
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="vhs-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Video player: ${artifact.title}`}
      tabIndex={-1}
    >
      <div className="vhs-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="vhs-container">
        <div className="vhs-screen">
          {showStatic && <div className="vhs-static" aria-hidden="true" />}
          <div className="vhs-scanlines" aria-hidden="true" />
          <video
            ref={videoRef}
            src={artifact.src}
            poster={artifact.poster}
            onTimeUpdate={handleTimeUpdate}
            onLoadedData={handleLoadedData}
            onPlay={handlePlay}
            onPause={handlePause}
            playsInline
            aria-label={artifact.title}
          >
            {artifact.captions && (
              <track
                kind="captions"
                src={artifact.captions}
                srcLang="en"
                label="English"
                default
              />
            )}
          </video>
          {artifact.placeholder && (
            <div className="vhs-placeholder-badge" aria-hidden="true">
              PLACEHOLDER
            </div>
          )}
        </div>
        <div className="vhs-controls">
          <button
            className="vhs-play-btn"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isLoading}
          >
            {isPlaying ? "▮▮" : "▶"}
          </button>
          <div
            className="vhs-progress"
            onClick={handleSeek}
            role="slider"
            aria-label="Video progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          >
            <div
              className="vhs-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="vhs-title">{artifact.title}</span>
        </div>
        <button
          className="vhs-close"
          onClick={onClose}
          aria-label="Close video player"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
