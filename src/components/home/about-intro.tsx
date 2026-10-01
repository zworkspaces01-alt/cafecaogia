import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { format } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { buyerVisitPhotos, factoryPhotos } from "@/lib/site";

/** Homepage introduction: a staggered collage of our own photos beside who we are, in numbers. */
export async function AboutIntro({ foundingYear, gradeCount }: { foundingYear: number; gradeCount: number }) {
  const dict = await getDictionary();
  const t = dict.homeAbout;
  const years = Math.max(1, new Date().getUTCFullYear() - foundingYear);
  const values = { year: foundingYear, count: gradeCount };

  const photo = (src: string, alt: string, aspect: string) => (
    <div data-reveal-image className={`relative overflow-hidden rounded-3xl bg-mist ${aspect}`}>
      <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 22vw, 45vw" className="object-cover" />
    </div>
  );

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="grid grid-cols-2 gap-3 pb-8 md:gap-4">
          <div className="space-y-3 md:space-y-4">
            {photo(factoryPhotos.containerVacuumBags, dict.gallery.photos.containerVacuumBags, "aspect-[4/3]")}
            {/* Index 2 of buyerVisitPhotos: lunch with visiting buyers (see `about.visitPhotos`). */}
            {photo(buyerVisitPhotos[2], dict.about.visitPhotos[2], "aspect-square")}
          </div>
          <div className="mt-10 space-y-3 md:mt-14 md:space-y-4">
            {photo(factoryPhotos.greenBeansPalm, dict.gallery.photos.greenBeansPalm, "aspect-square")}
            <div className="relative">
              {photo(factoryPhotos.sacksSilos, dict.gallery.photos.sacksSilos, "aspect-[4/3]")}
              <div className="absolute end-3 -bottom-8 w-36 rounded-2xl bg-lime p-4 text-forest shadow-xl shadow-black/10 md:-end-4 md:w-44 md:p-5">
                <p dir="ltr" className="text-4xl font-medium tracking-tight tabular-nums md:text-5xl rtl:text-end">
                  {years}+
                </p>
                <p className="mt-1 text-xs leading-snug md:text-sm">{t.yearsLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionHeading eyebrow={t.eyebrow} title={t.title} accent={t.accent} />
          <p data-reveal className="mt-6 text-lg leading-relaxed text-muted">
            {t.body}
          </p>
          <ul data-reveal-stagger className="mt-8 space-y-4">
            {t.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-forest">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-moss" />
                <span>{format(point, values)}</span>
              </li>
            ))}
          </ul>
          <div data-reveal className="mt-10">
            <ButtonLink href="/about" variant="dark" arrow>
              {t.cta}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
