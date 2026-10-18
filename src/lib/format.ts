import type { Fragment, Kind, Rights } from "./posts";

export const KIND_LABELS: Record<Kind, string> = {
  dig: "Dig",
  "what-if": "What if",
  original: "Original",
  find: "Find",
};

export const RIGHTS_LABELS: Record<Rights, string> = {
  "public-domain": "public domain",
  copyrighted: "copyrighted",
  unknown: "rights unknown",
};

export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

const ROMAN: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

function roman(segment: string): string {
  let n = Number(segment);
  if (!Number.isInteger(n) || n < 1) return segment;
  let out = "";
  for (const [value, numeral] of ROMAN) for (; n >= value; n -= value) out += numeral;
  return out;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "5.5.19-28" under act.scene.line reads "5.5.19–28"; a label overrides it. */
export function formatLocator({ scheme, ref, label }: Fragment["locator"]): string {
  if (label) return label;
  const s = ref.replace(/-/g, "–").split(".");
  const lines = (r: string) => (r.includes("–") ? `ll. ${r}` : `l. ${r}`);
  switch (scheme) {
    case "chapter":
      return s.length === 2 ? `vol. ${s[0]}, ch. ${s[1]}` : `ch. ${s[0]}`;
    case "stanza.line":
      return `st. ${s[0]}, ${lines(s[1])}`;
    case "line":
      return lines(s[0]);
    case "book.chapter.verse":
      return `${capitalize(s[0])} ${s[1]}:${s[2]}`;
    case "book.section":
      return `${roman(s[0])}.${s[1]}`;
    case "section.paragraph":
      return `§${s[0]} ¶${s[1]}`;
    default:
      return s.join(".");
  }
}
