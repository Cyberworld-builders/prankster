/**
 * The shop's rooms. Each room is a shelf of posts at /<id>/<slug>, read from
 * content/<id>/<slug>.mdx. A room gets pages only once it is open.
 */
export type RoomId = "books" | "records" | "tapes";

export interface Room {
  id: RoomId;
  name: string;
  shelf: string;
  blurb: string;
  open: boolean;
}

export const ROOMS: Record<RoomId, Room> = {
  books: {
    id: "books",
    name: "Books",
    shelf: "The Library",
    blurb: "Books, stories, and the digs that go with them.",
    open: true,
  },
  records: {
    id: "records",
    name: "Records",
    shelf: "The Record Store",
    blurb: "Records and the people who pressed them.",
    open: false,
  },
  tapes: {
    id: "tapes",
    name: "Tapes",
    shelf: "The Tape Store",
    blurb: "Movies, tapes, and what happened to them.",
    open: false,
  },
};

export const openRooms = (): Room[] => Object.values(ROOMS).filter((room) => room.open);

export const SITE_URL = "https://scaryprankster.com";
