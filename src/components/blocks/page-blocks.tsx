// Page-builder blocks for inner pages and free content. Server components; each takes the block's
// resolved content (see lib/blocks/resolve.ts). Markup matches the sections they replaced.

import Image from "next/image";
import {
  ArrowUpRight,
  Award,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  Globe,
  HeartHandshake,
  Leaf,
  Package,
  ShieldCheck,
  Ship,
  Sprout,
  Timer,
  Trees,
  type LucideIcon,
} from "lucide-react";
import Link from "@/components/link";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getSettings } from "@/lib/content";
import { buyerVisitPhotos, site } from "@/lib/site";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  shield: ShieldCheck,
  handshake: HeartHandshake,
  leaf: Leaf,
  timer: Timer,
  trees: Trees,
  sprout: Sprout,
  factory: Factory,
  clipboard: ClipboardCheck,
  package: Package,
  ship: Ship,
  globe: Globe,
  award: Award,
};
const iconFor = (name: unknown) => icons[String(name)] ?? Leaf;

type Heading = { eyebrow?: string; title?: string; accent?: string; description?: string };

/** Section heading, or nothing when the block has no title (e.g. a run of note cards). */
function BlockHeading({ c, tone }: { c: Heading; tone?: "light" }) {
  if (!c.title && !c.accent) return null;
  return <SectionHeading tone={tone} eyebrow={c.eyebrow || undefined} title={c.title ?? ""} accent={c.accent || undefined} description={c.description || undefined} />;
}

const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

// ── Inner-page sections ──────────────────────────────────────────────────────

export function StoryBlock({ c }: { c: Heading & { paragraphs?: string[]; image1?: string; image1Alt?: string; image2?: string; image2Alt?: string } }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <BlockHeading c={{ ...c, description: undefined }} />
          <div data-reveal-stagger className="mt-6 space-y-4 leading-relaxed text-muted">
            {list<string>(c.paragraphs).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            [c.image1, c.image1Alt],
            [c.image2, c.image2Alt],
          ].map(([src, alt], i) =>
            src ? (
              <div key={i} data-reveal-image className={cn("relative aspect-[3/4] overflow-hidden rounded-3xl", i === 1 && "mt-12")}>
                <Image src={src} alt={alt ?? ""} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </div>
            ) : null,
          )}
        </div>
      </div>
    </section>
  );
}

export async function ValueCardsBlock({
  c,
  locale,
}: {
  c: Heading & { items?: { icon?: string; title: string; body: string }[]; showStats?: string };
  locale: string;
}) {
  const settings = c.showStats === "yes" ? await getSettings() : null;
  const stats = settings?.stats.map((s) => ({ value: s.value, label: (s.label as Record<string, string>)[locale] || s.label.en })) ?? [];
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page">
        <BlockHeading c={c} />
        <ul data-reveal-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list<{ icon?: string; title: string; body: string }>(c.items).map(({ icon, title, body }, i) => {
            const Icon = iconFor(icon);
            return (
              <li key={i} className="rounded-3xl bg-sand p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-lime text-forest">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-6 text-lg font-medium text-forest">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </li>
            );
          })}
        </ul>
        {stats.length > 0 && (
          <dl data-reveal-stagger className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse rounded-3xl bg-forest px-6 py-8 text-white">
                <dt className="mt-1 text-sm text-white/65">{s.label}</dt>
                <dd data-count={s.value} dir="ltr" className="text-start text-4xl font-medium tracking-tight text-lime tabular-nums rtl:text-end">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export function ImageCardsBlock({ c }: { c: Heading & { items?: { image?: string; product?: string; area?: string; name: string; body: string }[] } }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <BlockHeading c={c} />
        <ul data-reveal-stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {list<{ image?: string; product?: string; area?: string; name: string; body: string }>(c.items).map((item, i) => (
            <li key={i} className="overflow-hidden rounded-3xl bg-white">
              {item.image && (
                <div className="relative aspect-[4/3]">
                  <Image src={item.image} alt={[item.product, item.name].filter(Boolean).join(" · ")} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                  {item.product && (
                    <span className="absolute start-4 top-4 rounded-full bg-lime px-3 py-1 text-xs font-medium text-forest">{item.product}</span>
                  )}
                </div>
              )}
              <div className="p-6">
                {item.area && <p className="text-xs tracking-wide text-moss uppercase">{item.area}</p>}
                <h3 className="mt-1 text-xl font-medium text-forest">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type CompanyText = {
  legalTitle: string;
  brandNote: string;
  businessLinesLabel: string;
  businessLines: string;
  membershipsTitle: string;
  verifyTitle: string;
  verifyBody: string;
  verifyCta: string;
};

export async function CompanyDetailsBlock({ c, dict }: { c: CompanyText; dict: Dictionary }) {
  const { company, contact, memberships } = await getSettings();
  const { address } = contact;
  const details = [
    { label: dict.footer.company, value: `${company.legalName} (${company.legalNameVi})` },
    { label: dict.footer.enterpriseCode, value: company.enterpriseCode },
    { label: dict.stats.founded, value: String(company.foundingYear) },
    ...(c.businessLines ? [{ label: c.businessLinesLabel, value: c.businessLines }] : []),
    { label: dict.contact.office, value: `${address.street}, ${address.locality}, ${address.country}` },
  ];
  return (
    <section className="pb-20 md:pb-28">
      <div className="container-page grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div data-reveal className="rounded-3xl border border-mist bg-white p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-lg font-medium text-forest">
            <Building2 className="size-5 text-leaf" /> {c.legalTitle}
          </h2>
          <p className="mt-2 text-sm text-muted">{format(c.brandNote, { legalName: company.legalName, year: company.foundingYear })}</p>
          <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label}>
                <dt className="text-muted">{item.label}</dt>
                <dd className="mt-0.5 font-medium text-forest" dir="auto">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          {memberships.length > 0 && (
            <div className="mt-6 border-t border-mist pt-5">
              <p className="text-sm text-muted">{c.membershipsTitle}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {memberships.map((m) => (
                  <li key={m.name}>
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-sand px-3 py-1.5 text-xs font-medium text-forest hover:bg-mist">
                        {m.name}
                      </a>
                    ) : (
                      <span className="inline-flex rounded-full bg-sand px-3 py-1.5 text-xs font-medium text-forest">{m.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ButtonLink href="/company-profile" variant="outline-dark" arrow className="mt-6">
            {dict.profile.download}
          </ButtonLink>
        </div>

        <div data-reveal className="flex flex-col rounded-3xl bg-forest p-6 text-white md:p-8">
          <ShieldCheck className="size-8 text-lime" />
          <h2 className="mt-5 text-xl font-medium">{c.verifyTitle}</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{format(c.verifyBody, { code: company.enterpriseCode })}</p>
          <p className="mt-5 font-mono text-3xl tracking-wider text-lime" dir="ltr">
            {company.enterpriseCode}
          </p>
          <a
            href={site.registryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-forest transition-colors hover:bg-lime"
          >
            {c.verifyCta} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function BuyerVisitsBlock({ c, dict }: { c: Heading & { galleryCta?: string }; dict: Dictionary }) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page">
        <BlockHeading c={c} />
        <ul data-reveal-stagger className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {buyerVisitPhotos.map((src, i) => (
            <li key={src} className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-mist">
              <Image src={src} alt={dict.about.visitPhotos[i] ?? ""} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
            </li>
          ))}
        </ul>
        {c.galleryCta && (
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/gallery" variant="dark" arrow>
              {c.galleryCta}
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

type Step = { image?: string; icon?: string; title: string; lead: string; points?: string[]; meta?: string };

export function ProcessStepsBlock({ c }: { c: { step?: string; steps?: Step[] } }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <ol className="relative">
          {/* Timeline rail; the fill grows with scroll (data-progress-line). */}
          <span aria-hidden className="absolute start-5 top-0 bottom-0 w-px bg-mist md:start-1/2" />
          <span aria-hidden data-progress-line className="absolute start-5 top-0 bottom-0 w-px origin-top bg-leaf md:start-1/2" />
          {list<Step>(c.steps).map((step, i) => {
            const Icon = iconFor(step.icon);
            const flip = i % 2 === 1;
            return (
              <li key={i} className="relative grid gap-8 pb-20 ps-14 last:pb-0 md:grid-cols-2 md:gap-16 md:ps-0">
                <span className="absolute start-0 top-0 z-10 grid size-10 place-items-center rounded-full bg-lime text-forest ring-8 ring-sand md:start-1/2 md:-translate-x-1/2 rtl:md:translate-x-1/2">
                  <Icon className="size-5" />
                </span>
                <div data-reveal-image className={cn("relative aspect-[4/3] overflow-hidden rounded-3xl bg-mist", flip ? "md:order-2" : "md:order-1")}>
                  {step.image && <Image src={step.image} alt={step.title} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />}
                  {step.meta && (
                    <span className="absolute start-4 bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest backdrop-blur">{step.meta}</span>
                  )}
                </div>
                <div data-reveal-stagger className={cn("flex flex-col justify-center", flip ? "md:order-1 md:items-end md:text-end" : "md:order-2")}>
                  <p className="text-sm tracking-[0.2em] text-moss uppercase">
                    {c.step} <span dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                  </p>
                  <h2 className="mt-3 text-3xl font-medium tracking-tight text-forest md:text-4xl">{step.title}</h2>
                  <p className="mt-4 max-w-md leading-relaxed text-muted">{step.lead}</p>
                  <ul className={cn("mt-6 space-y-2.5", flip && "md:items-end")}>
                    {list<string>(step.points).map((point, j) => (
                      <li key={j} className={cn("flex gap-2.5 text-sm text-forest", flip && "md:flex-row-reverse")}>
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

type TableLabels = Dictionary["hubs"]["labels"];

export function ProductTableBlock({
  c,
  products,
  dict,
}: {
  c: { title?: string; accent?: string; description?: string; termsTitle?: string; labels?: Partial<TableLabels> };
  products: Product[];
  dict: Dictionary;
}) {
  const l = { ...dict.hubs.labels, ...c.labels };
  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <BlockHeading c={c} />
        <div data-reveal className="relative mt-12 overflow-x-auto rounded-3xl border border-mist bg-white">
          <table className="w-full min-w-[40rem] text-start text-sm">
            <thead className="bg-sand text-xs tracking-wide text-muted uppercase">
              <tr>
                {[l.grade, l.spec, l.origin, l.moq].map((label) => (
                  <th key={label} scope="col" className="px-5 py-4 text-start font-medium">
                    {label}
                  </th>
                ))}
                <th scope="col" className="px-5 py-4">
                  <span className="sr-only">{l.view}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {products.map((product) => (
                <tr key={product.slug} className="align-top">
                  <th scope="row" className="px-5 py-4 text-start font-medium text-forest">
                    <Link href={`/products/${product.slug}`} className="hover:text-leaf">
                      {product.name}
                    </Link>
                  </th>
                  <td className="px-5 py-4 text-muted">{product.grade}</td>
                  <td className="px-5 py-4 text-muted">{product.origin}</td>
                  <td className="px-5 py-4 text-muted">{product.moq}</td>
                  <td className="px-5 py-4 text-end">
                    <Link
                      href={`/contact?product=${product.slug}`}
                      className="inline-flex min-h-11 items-center gap-1 text-sm font-medium whitespace-nowrap text-leaf hover:text-forest"
                    >
                      {l.quote} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div data-reveal className="mt-8 rounded-3xl bg-sand p-6 md:p-8">
          <p className="font-medium text-forest">{c.termsTitle || l.termsTitle}</p>
          <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {dict.tradeTerms.items.map((term) => (
              <div key={term.label}>
                <dt className="text-sm text-muted">{term.label}</dt>
                <dd className="mt-1 text-lg font-medium text-forest">{term.value}</dd>
                <dd className="text-sm text-muted">{term.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

// ── Content blocks ───────────────────────────────────────────────────────────

export function RichTextBlock({ c }: { c: Heading & { paragraphs?: string[] } }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page max-w-4xl">
        <BlockHeading c={{ ...c, description: undefined }} />
        <div data-reveal-stagger className="mt-8 space-y-5 text-lg leading-relaxed text-muted">
          {list<string>(c.paragraphs).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FactsBlock({ c }: { c: Heading & { items?: { value: string; label: string }[] } }) {
  return (
    <section className="bg-forest py-20 text-white md:py-28">
      <div className="container-page">
        <BlockHeading c={c} tone="light" />
        <dl data-reveal-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list<{ value: string; label: string }>(c.items).map((fact, i) => (
            <div key={i} className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10">
              <dt className="sr-only">{fact.label}</dt>
              <dd dir="ltr" className="text-4xl font-medium tracking-tight text-lime rtl:text-end">
                {fact.value}
              </dd>
              <dd className="mt-3 text-sm leading-relaxed text-white/75">{fact.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function CardsBlock({ c }: { c: Heading & { tone?: string; items?: { title: string; body: string }[] } }) {
  const sand = c.tone === "sand";
  const items = list<{ title: string; body: string }>(c.items);
  const hasHeading = Boolean(c.title || c.accent);
  return (
    <section className={cn(sand ? "bg-white" : "", hasHeading ? "py-20 md:py-28" : "pb-20 md:pb-28")}>
      <div className="container-page">
        <BlockHeading c={c} />
        <div data-reveal-stagger className={cn("grid gap-4", hasHeading && "mt-12", items.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3")}>
          {items.map((item, i) => (
            <article key={i} className={cn("rounded-3xl p-6 md:p-8", sand ? "bg-sand" : "bg-white")}>
              <h3 className="text-lg font-medium text-forest">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DataTableBlock({ c }: { c: Heading & { columns?: string[]; rows?: { c1: string; c2: string; c3: string }[]; note?: string } }) {
  const columns = list<string>(c.columns);
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page">
        <BlockHeading c={c} />
        <div data-reveal className="relative mt-12 overflow-x-auto rounded-3xl border border-mist">
          <table className="w-full min-w-[32rem] text-start text-sm">
            {columns.length > 0 && (
              <thead className="bg-sand text-xs tracking-wide text-muted uppercase">
                <tr>
                  {columns.map((column, i) => (
                    <th key={i} scope="col" className="px-5 py-4 text-start font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-mist">
              {list<{ c1: string; c2: string; c3: string }>(c.rows).map((row, i) => (
                <tr key={i}>
                  <th scope="row" className="px-5 py-4 text-start font-medium text-forest">
                    {row.c1}
                  </th>
                  <td dir="ltr" className="px-5 py-4 text-muted rtl:text-end">
                    {row.c2}
                  </td>
                  <td className="px-5 py-4 text-muted">{row.c3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.note && (
          <p data-reveal className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
            {c.note}
          </p>
        )}
      </div>
    </section>
  );
}

export function SourcesBlock({ c }: { c: { title?: string; note?: string; items?: { label: string; url: string }[] } }) {
  return (
    <section className="pb-20 md:pb-28">
      <div className="container-page">
        <h2 className="text-sm font-medium text-forest">{c.title}</h2>
        {c.note && <p className="mt-1 text-xs text-muted">{c.note}</p>}
        <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {list<{ label: string; url: string }>(c.items)
            .filter((source) => /^https?:\/\//.test(source.url))
            .map((source, i) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1 text-muted underline decoration-mist underline-offset-4 hover:text-forest"
                >
                  {source.label}
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 rtl:-scale-x-100" />
                </a>
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}
