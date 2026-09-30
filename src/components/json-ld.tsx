import { site } from "@/lib/site";

/** Stable node IDs, so JSON-LD on different pages describes the same organization and website. */
export const schemaIds = {
  organization: `${site.url}/#organization`,
  website: `${site.url}/#website`,
};

/** A JSON-LD block; `<` is escaped so text from the CMS can't close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
