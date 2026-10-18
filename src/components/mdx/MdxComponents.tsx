import type { ComponentPropsWithoutRef, ReactNode } from "react";
import BookCover from "@/components/BookCover";
import { RIGHTS_LABELS, formatLocator } from "@/lib/format";
import type { PostMeta } from "@/lib/posts";

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

/**
 * The quoted passage of a fragment post, with a citation line generated from
 * the post's `work` and `fragment` frontmatter. `verse` keeps line breaks.
 */
function Passage({ meta, verse, children }: { meta: PostMeta; verse?: boolean; children: ReactNode }) {
  const { work, fragment } = meta;
  return (
    <figure className="passage">
      <blockquote className={verse ? "verse" : undefined}>{children}</blockquote>
      {work && fragment && (
        <figcaption>
          <cite>{work.title}</cite>
          {work.creator && `, ${work.creator}`}
          {work.year && ` (${work.year})`}, {formatLocator(fragment.locator)}
          {fragment.translator && ` · trans. ${fragment.translator}`} · {fragment.edition} · {RIGHTS_LABELS[fragment.rights]} ·{" "}
          <Anchor href={fragment.sourceUrl}>Read the whole work</Anchor>
        </figcaption>
      )}
    </figure>
  );
}

export const mdxComponents = {
  a: Anchor,
  Figure,
  Cover,
};

/** The components for one post's body: the shared set plus those that read its frontmatter. */
export function postComponents(meta: PostMeta) {
  return {
    ...mdxComponents,
    Passage: (props: { verse?: boolean; children: ReactNode }) => <Passage meta={meta} {...props} />,
  };
}
