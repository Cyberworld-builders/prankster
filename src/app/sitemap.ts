import type { MetadataRoute } from "next";
import { postsInRoom } from "@/lib/posts";
import { SITE_URL, openRooms } from "@/lib/rooms";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }];

  for (const room of openRooms()) {
    const posts = postsInRoom(room.id).filter(({ meta }) => !meta.isDraft);
    pages.push({ url: `${SITE_URL}/${room.id}`, lastModified: posts[0]?.meta.publishedDate, changeFrequency: "weekly", priority: 0.8 });
    for (const { meta } of posts) {
      pages.push({ url: `${SITE_URL}/${room.id}/${meta.slug}`, lastModified: meta.modifiedDate, changeFrequency: "monthly", priority: 0.7 });
    }
  }
  return pages;
}
