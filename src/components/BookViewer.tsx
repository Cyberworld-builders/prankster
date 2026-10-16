"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Artifact } from "@/content/artifacts";

interface BookViewerProps {
  artifact: Artifact;
  onClose: () => void;
}

export function BookViewer({ artifact, onClose }: BookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
    fetch(artifact.src)
      .then((res) => res.text())
      .then((content) => {
        setText(content);
        setIsLoading(false);
      })
      .catch(() => {
        setText("[Could not load text content.]");
        setIsLoading(false);
      });
  }, [artifact.src]);

  return (
    <div
      ref={containerRef}
      className="book-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Book: ${artifact.title}`}
      tabIndex={-1}
    >
      <div className="book-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="book-container">
        <div className="book-page">
          <div className="book-page-edge" aria-hidden="true" />
          <div className="book-content">
            <h2 className="book-title">{artifact.title}</h2>
            {artifact.placeholder && (
              <div className="book-placeholder-badge" aria-hidden="true">
                PLACEHOLDER
              </div>
            )}
            {isLoading ? (
              <p className="book-loading">Loading...</p>
            ) : (
              <div className="book-text" aria-live="polite">
                {text.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
          <div className="book-binding" aria-hidden="true" />
        </div>
        <button
          className="book-close"
          onClick={onClose}
          aria-label="Close book"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
