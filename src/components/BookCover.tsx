/**
 * Placeholder media: a cloth-bound cover drawn from the title, so a post has
 * art before any real photograph or scan exists. The same title always gets
 * the same cover.
 */
const CLOTHS = [
  { cloth: "#5b1f1a", ink: "#e9cf98" },
  { cloth: "#1f3a33", ink: "#e4d6ad" },
  { cloth: "#2a2436", ink: "#d9b77a" },
  { cloth: "#3b2a17", ink: "#efd9a6" },
  { cloth: "#16253a", ink: "#d8c08a" },
  { cloth: "#3a1630", ink: "#e8c9a0" },
];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

export default function BookCover({ title, creator, className }: { title: string; creator?: string; className?: string }) {
  const h = hash(title);
  const { cloth, ink } = CLOTHS[h % CLOTHS.length];
  const lines = wrap(title.toUpperCase(), 14);
  const ornament = h % 3;
  const top = 150 - lines.length * 13;

  return (
    <svg viewBox="0 0 240 360" className={className} role="img" aria-label={`Placeholder cover for ${title}`}>
      <rect width="240" height="360" fill={cloth} />
      <rect x="0" y="0" width="18" height="360" fill="#000" opacity=".28" />
      <rect x="18" y="0" width="2" height="360" fill={ink} opacity=".25" />
      <rect x="34" y="20" width="188" height="320" fill="none" stroke={ink} strokeWidth="1.5" opacity=".7" />
      <rect x="40" y="26" width="176" height="308" fill="none" stroke={ink} strokeWidth=".6" opacity=".5" />
      {ornament === 0 && <circle cx="128" cy="78" r="16" fill="none" stroke={ink} strokeWidth="1.2" opacity=".75" />}
      {ornament === 1 && <path d="M128 60 L142 84 L114 84 Z" fill="none" stroke={ink} strokeWidth="1.2" opacity=".75" />}
      {ornament === 2 && <path d="M110 78 H146 M128 60 V96" stroke={ink} strokeWidth="1.2" opacity=".75" />}
      {lines.map((line, i) => (
        <text key={i} x="128" y={top + i * 26} textAnchor="middle" fill={ink} fontFamily="Georgia, serif" fontSize="19" letterSpacing="2">
          {line}
        </text>
      ))}
      <path d={`M88 ${top + lines.length * 26} H168`} stroke={ink} strokeWidth=".8" opacity=".6" />
      {creator && (
        <text x="128" y="300" textAnchor="middle" fill={ink} fontFamily="Georgia, serif" fontSize="12" fontStyle="italic" opacity=".85">
          {creator}
        </text>
      )}
    </svg>
  );
}
