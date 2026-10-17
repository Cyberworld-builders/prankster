"use client";

import { useEffect, useRef, type RefObject } from "react";

const focusable = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// Modal behaviour shared by the artifact viewers: focus moves in on open, Tab
// stays inside, Escape closes, and focus returns to whatever opened it.
// onToggle (Space/Enter) only fires when the dialog itself has focus, so
// buttons inside keep their native keyboard activation.
export function useDialog(ref: RefObject<HTMLElement | null>, onClose: () => void, onToggle?: () => void) {
  const handlers = useRef({ onClose, onToggle });
  handlers.current = { onClose, onToggle };

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      const dialog = ref.current;
      if (!dialog) return;
      if (e.key === "Escape") {
        handlers.current.onClose();
      } else if (e.key === "Tab") {
        const items = [...dialog.querySelectorAll<HTMLElement>(focusable)];
        if (!items.length) return e.preventDefault();
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === dialog)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      } else if ((e.key === " " || e.key === "Enter") && e.target === dialog && handlers.current.onToggle) {
        e.preventDefault();
        handlers.current.onToggle();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (opener?.isConnected) opener.focus();
    };
  }, [ref]);
}

// Arrow/Home/End seeking for the role="slider" progress bars.
export function seekKey(e: React.KeyboardEvent, media: HTMLMediaElement | null) {
  if (!media || !media.duration) return;
  const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
  if (step !== undefined) media.currentTime = Math.min(media.duration, Math.max(0, media.currentTime + step));
  else if (e.key === "Home") media.currentTime = 0;
  else if (e.key === "End") media.currentTime = media.duration;
  else return;
  e.preventDefault();
}
