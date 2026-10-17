import type { ComponentPropsWithoutRef } from "react";
import BookCover from "@/components/BookCover";

/**
 * Components available inside post bodies. Posts in content/<room>/*.mdx carry
 * no classes; element styling for every post lives under `.page` in
 * src/app/globals.css.
 */

function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** A generated placeholder cover, for when there is no real image yet. */
function Cover({ title, creator, caption }: { title: string; creator?: string; caption?: string }) {
  return (
    <figure className="cover-figure">
      <BookCover title={title} creator={creator} className="cover" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Anchor({ href = "", ...props }: ComponentPropsWithoutRef<"a">) {
  const external = /^https?:\/\//.test(href);
  return <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...props} />;
}

export const mdxComponents = {
  a: Anchor,
  Figure,
  Cover,
};
