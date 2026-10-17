import { ImageResponse } from "next/og";
import { getPost, postsInRoom } from "@/lib/posts";
import { ROOMS, openRooms, type RoomId } from "@/lib/rooms";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Scary Prankster";

export function generateStaticParams() {
  return openRooms().flatMap((room) => postsInRoom(room.id).map(({ meta }) => ({ room: room.id, slug: meta.slug })));
}

export default async function OgImage({ params }: { params: Promise<{ room: string; slug: string }> }) {
  const { room, slug } = await params;
  const post = getPost(room as RoomId, slug);
  const title = post?.meta.title ?? "Scary Prankster";
  const shelf = ROOMS[room as RoomId]?.shelf ?? "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b0908", padding: "64px 72px", color: "#eee2c9", fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 22, letterSpacing: 6, color: "#f2e8d2" }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#c54931", marginRight: 18 }} />
          SCARY PRANKSTER
          <span style={{ color: "#d66949", padding: "0 18px" }}>/</span>
          {shelf.toUpperCase()}
        </div>
        <div style={{ display: "flex", fontSize: title.length > 60 ? 54 : 66, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", height: 2, background: "#a58b65", opacity: 0.6 }} />
      </div>
    ),
    size,
  );
}
