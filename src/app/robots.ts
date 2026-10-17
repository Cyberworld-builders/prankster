import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/rooms";

export default function robots(): MetadataRoute.Robots {
  // Previews carry drafts; only production is indexable.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml` };
}
