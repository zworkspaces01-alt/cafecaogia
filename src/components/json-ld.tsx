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

/** BreadcrumbList from (name, absolute URL) pairs, home first. */
export function breadcrumbList(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
  };
}

/** A WebPage node (or subtype such as AboutPage) that belongs to the site and is about the organization. */
export function webPage(type: string, url: string, name: string, inLanguage: string) {
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    inLanguage,
    isPartOf: { "@id": schemaIds.website },
    about: { "@id": schemaIds.organization },
  };
}
