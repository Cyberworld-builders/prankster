import type { Kind } from "./posts";

export const KIND_LABELS: Record<Kind, string> = {
  dig: "Dig",
  "what-if": "What if",
  original: "Original",
  find: "Find",
};

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
