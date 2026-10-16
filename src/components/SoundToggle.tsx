"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "scaryprankster-sound-enabled";

interface SoundToggleProps {
  onSoundChange?: (enabled: boolean) => void;
}

export function SoundToggle({ onSoundChange }: SoundToggleProps) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setSoundEnabled(true);
      onSoundChange?.(true);
    }
  }, [onSoundChange]);

  const toggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
    onSoundChange?.(newValue);
  };

  if (!mounted) return null;

  return (
    <button
      className="sound-toggle"
      onClick={toggle}
      aria-label={soundEnabled ? "Mute ambient sound" : "Enable ambient sound"}
      aria-pressed={soundEnabled}
      title={soundEnabled ? "Sound on" : "Sound off"}
    >
      {soundEnabled ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}

export function useSoundPreference(): [boolean, (v: boolean) => void] {
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setSoundEnabled(true);
    }
  }, []);

  const setSound = (value: boolean) => {
    setSoundEnabled(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  return [soundEnabled, setSound];
}
