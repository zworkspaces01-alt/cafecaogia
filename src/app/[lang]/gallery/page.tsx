import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import { PageHero } from "@/components/page-hero";
import { PhotoGallery, type GallerySection } from "@/components/photo-gallery";
import { format } from "@/i18n/format";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { pageMeta } from "@/lib/seo";
import { buyerVisitPhotos, factoryPhotos, galleryGroups, tallVisitPhotos } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    ...(await pageMeta("gallery", { title: dict.gallery.metaTitle, description: dict.gallery.metaDescription })),
    alternates: localeAlternates(locale, "/gallery"),
  };
}

export default async function GalleryPage() {
  const dict = await getDictionary();
  const t = dict.gallery;
  const count = (n: number) => format(t.photoCount, { count: n });

  const sections: GallerySection[] = [
    ...galleryGroups.map((group) => ({
      key: group.key,
      ...t.groups[group.key],
      count: count(group.photos.length),
      photos: group.photos.map(({ key, tall }) => ({ src: factoryPhotos[key], alt: t.photos[key], tall })),
    })),
    {
      key: "visits",
      ...t.groups.visits,
      count: count(buyerVisitPhotos.length),
      photos: buyerVisitPhotos.map((src, i) => ({ src, alt: dict.about.visitPhotos[i], tall: tallVisitPhotos.has(i) })),
    },
  ];

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} image={factoryPhotos.sacksSilos} />

      <div className="bg-white py-20 md:py-28">
        <div className="container-page">
          <PhotoGallery
            sections={sections}
            labels={{ open: t.open, close: t.close, previous: t.previous, next: t.next, counter: t.counter }}
          />
        </div>
      </div>

      <CtaBanner />
    </>
  );
}
