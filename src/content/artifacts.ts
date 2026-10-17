export type ArtifactType = "video" | "audio";
export type RoomId = "video" | "record";

export interface Artifact {
  id: string;
  room: RoomId;
  type: ArtifactType;
  title: string;
  src: string;
  poster?: string;
  duration?: number;
  captions?: string;
  placeholder: boolean;
  description?: string;
}

export const artifacts: Artifact[] = [
  {
    id: "placeholder-tape",
    room: "video",
    type: "video",
    title: "Test Signal",
    src: "/media/video/placeholder.mp4",
    poster: "/media/video/placeholder-poster.jpg",
    captions: "/media/video/placeholder.vtt",
    duration: 5,
    placeholder: true,
    description: "A test signal pattern awaiting real content.",
  },
  {
    id: "placeholder-track",
    room: "record",
    type: "audio",
    title: "Room Tone",
    src: "/media/record/placeholder.mp3",
    duration: 8,
    placeholder: true,
    description: "A synthetic tone awaiting a real recording.",
  },
];

export function getArtifactsByRoom(room: RoomId): Artifact[] {
  return artifacts.filter((a) => a.room === room);
}

export function getArtifactById(id: string): Artifact | undefined {
  return artifacts.find((a) => a.id === id);
}

export function getFirstArtifactForRoom(room: RoomId): Artifact | undefined {
  return artifacts.find((a) => a.room === room);
}
