// Page-builder blocks for the listing pages, contact, leadership, 404 and the product / article
// templates. Server components; each takes the block's resolved content (`c`) plus whatever data its
// page provides (the product or article being shown, the active filter…). Markup matches the pages
// they replaced.

import Image from "next/image";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Package,
  Scale,
} from "lucide-react";
import { ArticleBody, readingMinutes } from "@/components/article-body";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { InquiryForm } from "@/components/inquiry-form";
import Link from "@/components/link";
import { LogoMark } from "@/components/logo";
import { PhotoGallery, type GallerySection } from "@/components/photo-gallery";
import { PostCard } from "@/components/post-card";
import { ProductCard } from "@/components/product-card";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { localeTags, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { format, formatDate } from "@/i18n/format";
import { getCeo, getPosts, getPostsForProduct, getSettings, whatsappLink, type Post } from "@/lib/content";
import { getProducts } from "@/lib/products";
import { buyerVisitPhotos, factoryPhotos, galleryGroups, photos, site, tallVisitPhotos } from "@/lib/site";
import type { Category, PostCategory, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

type Heading = { eyebrow?: string; title?: string; accent?: string; description?: string };

// ── Listing pages ─────────────────────────────────────────────────────────────

/** /products: category filter and the product grid (filter from the query string). */
export async function ProductGridBlock({
  c,
  dict,
  category,
}: {
  c: { filterLabel?: string; all?: string; empty?: string };
  dict: Dictionary;
  category?: Category;
}) {
  const products = await getProducts(category);
  const filters: { value?: Category; label: string }[] = [
    { label: c.all || dict.productsPage.all },
    { value: "coffee", label: dict.categories.coffee },
    { value: "cashew", label: dict.categories.cashew },
  ];
  return (
    <section className="py-16 md:py-20">
      <div className="container-page">
        <nav data-reveal aria-label={c.filterLabel} className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = f.value === category;
            return (
              <Link
                key={f.label}
                href={f.value ? `/products?category=${f.value}` : "/products"}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-5 text-sm transition-colors",
                  active ? "bg-forest text-white" : "bg-white text-forest hover:bg-mist",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>

        {/* Keeps the outline H1 → H2 → H3 (product cards) for crawlers and screen readers. */}
        <h2 className="sr-only">{filters.find((f) => f.value === category)?.label}</h2>
        <ul data-reveal-stagger className="mt-10 grid gap-x-6 gap-y-6 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} categoryLabel={dict.categories[product.category]} compact />
            </li>
          ))}
        </ul>
        {products.length === 0 && <p className="mt-10 text-muted">{c.empty}</p>}
      </div>
    </section>
  );
}

const topics: PostCategory[] = ["guide", "market", "news"];

/** /insights: topic filter, a lead article and the rest as cards. */
export async function PostListBlock({
  c,
  dict,
  locale,
  category,
}: {
  c: { filterLabel?: string; all?: string; empty?: string };
  dict: Dictionary;
  locale: Locale;
  category?: PostCategory;
}) {
  const posts = await getPosts();
  const t = dict.insights;
  // Only offer topics that have articles, and no filter bar at all while there is just one topic.
  const available = topics.filter((topic) => posts.some((post) => post.category === topic));
  const shown = category ? posts.filter((post) => post.category === category) : posts;
  const [lead, ...rest] = shown;
  const cardProps = { minRead: t.minRead, localeTag: localeTags[locale] };

  return (
    <section className="py-16 md:py-20">
      <div className="container-page">
        {available.length > 1 && (
          <nav data-reveal aria-label={c.filterLabel} className="mb-10 flex flex-wrap gap-2">
            {[undefined, ...available].map((topic) => {
              const active = topic === category;
              return (
                <Link
                  key={topic ?? "all"}
                  href={topic ? `/insights?category=${topic}` : "/insights"}
                  aria-current={active ? "page" : undefined}
                  className={cn("rounded-full px-5 py-2 text-sm transition-colors", active ? "bg-forest text-white" : "bg-white text-forest hover:bg-mist")}
                >
                  {topic ? t.categories[topic] : c.all || t.all}
                </Link>
              );
            })}
          </nav>
        )}

        {lead ? (
          <>
            <div data-reveal>
              <PostCard post={lead} categoryLabel={t.categories[lead.category]} featured {...cardProps} />
            </div>
            {rest.length > 0 && (
              <ul data-reveal-stagger className="mt-16 grid gap-x-6 gap-y-12 border-t border-mist pt-12 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <li key={post.slug}>
                    <PostCard post={post} categoryLabel={t.categories[post.category]} {...cardProps} />
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-muted">{c.empty}</p>
        )}
      </div>
    </section>
  );
}

/** /gallery: every own photo, grouped by stage, with a lightbox. */
export function PhotoGalleryBlock({ c, dict }: { c: { photoCount?: string }; dict: Dictionary }) {
  const t = dict.gallery;
  const count = (n: number) => format(c.photoCount || t.photoCount, { count: n });
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
    <div className="bg-white py-20 md:py-28">
      <div className="container-page">
        <PhotoGallery sections={sections} labels={{ open: t.open, close: t.close, previous: t.previous, next: t.next, counter: t.counter }} />
      </div>
    </div>
  );
}

// ── Contact ──────────────────────────────────────────────────────────────────

type ContactText = {
  asideTitle?: string;
  asideBody?: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  office?: string;
  hours?: string;
  hoursValue?: string;
  tradeTerms?: string;
  incoterms?: string;
  payment?: string;
  sampleMessage?: string;
};

/** /contact: company contact details beside the quote form (product and sample come from the query string). */
export async function ContactFormBlock({
  c,
  dict,
  locale,
  product,
  sample,
}: {
  c: ContactText;
  dict: Dictionary;
  locale: Locale;
  product?: string;
  sample?: boolean;
}) {
  const [{ contact }, products] = await Promise.all([getSettings(), product ? getProducts() : Promise.resolve([] as Product[])]);
  const selected = products.find((p) => p.slug === product);
  const { address } = contact;
  const contacts = [
    { icon: Mail, label: c.email, value: contact.email, href: `mailto:${contact.email}` },
    { icon: WhatsAppIcon, label: `${c.whatsapp} / ${c.phone}`, value: contact.whatsapp, href: whatsappLink(contact.whatsapp), ltr: true, brand: true },
    { icon: MapPin, label: c.office, value: `${address.street}, ${address.locality}, ${address.country}`, ltr: true },
    { icon: Clock, label: c.hours, value: c.hoursValue },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.8fr]">
        {/* Phones show the form first; the contact details follow it. */}
        <aside className="order-last lg:order-none">
          <div data-reveal-stagger>
            <h2 className="text-2xl font-medium text-forest">{c.asideTitle}</h2>
            <p className="mt-3 text-muted">{c.asideBody}</p>
          </div>
          <ul data-reveal-stagger className="mt-8 space-y-3">
            {contacts.map(({ icon: Icon, label, value, href, ltr, brand }) => (
              <li key={label} className="flex items-start gap-4 rounded-2xl bg-white p-4">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${brand ? "bg-[#25d366] text-white" : "bg-lime text-forest"}`}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted">{label}</span>
                  {href ? (
                    <a
                      href={href}
                      dir={ltr ? "ltr" : undefined}
                      className="text-sm font-medium break-words text-forest hover:text-leaf"
                      {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
                    >
                      {value}
                    </a>
                  ) : (
                    <span dir={ltr ? "ltr" : undefined} className="block text-sm font-medium text-forest">
                      {value}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div data-reveal className="mt-6 rounded-2xl border border-mist p-5 text-sm text-muted">
            <p className="font-medium text-forest">{c.tradeTerms}</p>
            <p className="mt-2">
              {c.incoterms}: {site.incoterms.join(", ")}
            </p>
            <p>
              {c.payment}: {dict.common.paymentTerms.join(", ")}
            </p>
          </div>
        </aside>

        <InquiryForm
          locale={locale}
          t={dict.form}
          defaultProduct={selected?.slug}
          defaultMessage={selected && sample && c.sampleMessage ? format(c.sampleMessage, { product: selected.name }) : undefined}
        />
      </div>
    </section>
  );
}

// ── Leadership ───────────────────────────────────────────────────────────────

/** The CEO's photo, name, bio and direct contacts (from Đội ngũ & CEO). Renders nothing without a published CEO. */
export async function CeoProfileBlock({ c }: { c: { contactTitle?: string } }) {
  const leader = await getCeo();
  if (!leader) return null;
  return (
    <section className="py-20 md:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div data-reveal-image className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-forest">
          {leader.photo ? (
            <Image src={leader.photo} alt={leader.name} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center">
              <LogoMark onDark className="size-40 rounded-3xl p-6" />
            </div>
          )}
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-4 backdrop-blur">
            <p className="text-lg font-medium text-forest">{leader.name}</p>
            <p className="text-sm text-muted">{leader.role} · Cao Gia</p>
          </div>
        </div>

        <div data-reveal-stagger>
          <p className="text-sm tracking-[0.2em] text-moss uppercase">{leader.role}</p>
          <h2 className="mt-3 text-4xl font-medium tracking-tight text-forest md:text-5xl">{leader.name}</h2>
          <div className="mt-6 space-y-4 leading-relaxed text-muted">
            {leader.bio.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          {leader.quote && (
            <blockquote className="mt-8 border-s-4 border-lime ps-5 font-serif text-2xl leading-snug text-forest italic md:text-3xl">&ldquo;{leader.quote}&rdquo;</blockquote>
          )}
          <div className="mt-8">
            <p className="text-sm text-muted">{c.contactTitle}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {leader.email && (
                <a
                  href={`mailto:${leader.email}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-forest/20 px-5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-white"
                >
                  <Mail className="size-4" /> {leader.email}
                </a>
              )}
              {leader.whatsapp && (
                <a
                  href={whatsappLink(leader.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25d366] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  dir="ltr"
                >
                  <WhatsAppIcon className="size-4" /> {leader.whatsapp}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Numbered cards on a dark band (e.g. working principles). */
export function NumberedCardsBlock({ c }: { c: Heading & { items?: { title: string; body: string }[] } }) {
  return (
    <section className="bg-forest py-20 text-white md:py-28">
      <div className="container-page">
        <SectionHeading tone="light" eyebrow={c.eyebrow || undefined} title={c.title ?? ""} accent={c.accent || undefined} />
        <ol data-reveal-stagger className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {list<{ title: string; body: string }>(c.items).map((item, i) => (
            <li key={i} className="bg-forest p-6 md:p-8">
              <span className="font-serif text-5xl text-lime italic" dir="ltr">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-lg font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A heading beside a ticked list with a call-to-action button. */
export function ChecklistBlock({ c }: { c: Heading & { items?: string[]; cta?: string; ctaHref?: string } }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
        <SectionHeading eyebrow={c.eyebrow || undefined} title={c.title ?? ""} accent={c.accent || undefined} description={c.description || undefined} />
        <div data-reveal-stagger className="rounded-3xl bg-white p-6 md:p-8">
          <ul className="space-y-4">
            {list<string>(c.items).map((item, i) => (
              <li key={i} className="flex gap-3 text-forest">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-leaf" />
                {item}
              </li>
            ))}
          </ul>
          {c.cta && (
            <ButtonLink href={c.ctaHref || "/contact"} variant="dark" arrow className="mt-8">
              {c.cta}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}

/** The 404 message with links back into the site. */
export function NotFoundBlock({ c }: { c: { title?: string; accent?: string; body?: string; home?: string; browse?: string } }) {
  return (
    <section className="bg-forest pt-40 pb-28 text-white">
      <div className="container-page max-w-2xl text-center">
        <p className="text-sm tracking-[0.2em] text-lime uppercase">404</p>
        <h1 className="mt-4 text-5xl font-medium tracking-tight">
          {c.title} <em className="font-serif font-normal">{c.accent}</em>
        </h1>
        <p className="mt-5 text-white/75">{c.body}</p>
        <div className="mt-8 flex justify-center gap-3">
          {c.home && <ButtonLink href="/">{c.home}</ButtonLink>}
          {c.browse && (
            <ButtonLink href="/products" variant="outline-light">
              {c.browse}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Product template ─────────────────────────────────────────────────────────

type ProductText = Dictionary["product"];

/** The product itself: breadcrumb, photos, name, summary, key facts, spec table and quote buttons. */
export function ProductMainBlock({ c, dict, product }: { c: Partial<ProductText>; dict: Dictionary; product: Product }) {
  const t = { ...dict.product, ...c };
  const categoryLabel = dict.categories[product.category];
  return (
    <>
      <div className="bg-forest pt-28" />
      <section className="py-10 md:py-14">
        <div className="container-page">
          <nav aria-label={dict.common.breadcrumb} className="flex items-center gap-1.5 text-sm text-muted">
            <Link href="/products" className="-my-3 py-3 hover:text-forest">
              {t.products}
            </Link>
            <ChevronRight className="size-3.5 rtl:-scale-x-100" />
            <Link href={`/products?category=${product.category}`} className="-my-3 py-3 hover:text-forest">
              {categoryLabel}
            </Link>
            <ChevronRight className="size-3.5 rtl:-scale-x-100" />
            <span className="text-forest">{product.name}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* No reveal animation: the main photo is the LCP element and paints straight from the HTML. */}
            <div className="grid grid-cols-2 gap-3 self-start lg:sticky lg:top-24">
              <div className="relative col-span-2 aspect-[4/3] overflow-hidden rounded-3xl bg-mist">
                <Image src={product.image} alt={product.name} fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              {product.gallery.slice(0, 2).map((src) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
                  <Image src={src} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                </div>
              ))}
            </div>

            <div data-reveal-stagger>
              <p className="text-sm tracking-wide text-moss uppercase">{product.grade}</p>
              <h1 className="mt-2 text-4xl leading-tight font-medium tracking-tight text-forest md:text-5xl">{product.name}</h1>
              <p className="mt-5 text-lg leading-relaxed text-forest/80">{product.summary}</p>
              <p className="mt-4 leading-relaxed text-muted">{product.description}</p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: MapPin, label: t.origin, value: product.origin },
                  { icon: Scale, label: t.moq, value: product.moq },
                  { icon: Package, label: t.packing, value: product.packaging },
                ].map(({ icon: Icon, label, value }) => (
                  <li key={label} className="rounded-2xl bg-white p-4">
                    <Icon className="size-4 text-leaf" />
                    <p className="mt-3 text-xs text-muted">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-forest">{value}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 overflow-hidden rounded-2xl bg-white">
                <h2 className="border-b border-mist px-5 py-4 text-sm font-medium text-forest">{t.specification}</h2>
                <dl className="divide-y divide-mist">
                  {product.specs.map((spec) => (
                    <div key={spec.label} className="flex justify-between gap-4 px-5 py-3 text-sm">
                      <dt className="text-muted">{spec.label}</dt>
                      <dd className="text-end font-medium text-forest">{spec.value}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 px-5 py-3 text-sm">
                    <dt className="text-muted">{t.terms}</dt>
                    <dd className="text-end font-medium text-forest">
                      {site.incoterms.slice(0, 3).join(" / ")} · {dict.common.paymentTerms.join(", ")}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={`/contact?product=${product.slug}`} variant="dark" arrow>
                  {t.requestQuote}
                </ButtonLink>
                <ButtonLink href={`/contact?product=${product.slug}&sample=1`} variant="outline-dark">
                  {t.askSample}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Articles tagged with the product (Bài viết → sản phẩm liên quan). */
export async function ProductInsightsBlock({ c, dict, locale, product }: { c: { title?: string; accent?: string }; dict: Dictionary; locale: Locale; product: Product }) {
  const insights = await getPostsForProduct(product.slug);
  if (insights.length === 0) return null;
  return (
    <section className="pb-20">
      <div className="container-page">
        <SectionHeading title={c.title ?? ""} accent={c.accent || undefined} />
        <ul data-reveal-stagger className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {insights.slice(0, 3).map((post) => (
            <li key={post.slug}>
              <PostCard post={post} categoryLabel={dict.insights.categories[post.category]} minRead={dict.insights.minRead} localeTag={localeTags[locale]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Three other grades from the same category. */
export async function RelatedProductsBlock({ c, dict, product }: { c: { title?: string; accent?: string }; dict: Dictionary; product: Product }) {
  const related = (await getProducts(product.category)).filter((p) => p.slug !== product.slug).slice(0, 3);
  if (related.length === 0) return null;
  return (
    <section className="bg-white py-20">
      <div className="container-page">
        <SectionHeading title={c.title ?? ""} accent={c.accent || undefined} />
        <ul data-reveal-stagger className="mt-10 grid gap-x-6 gap-y-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3">
          {related.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} categoryLabel={dict.categories[p.category]} compact />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Article template ─────────────────────────────────────────────────────────

/** The article: breadcrumb, header, cover, body, tagged products and a sample/quote box. */
export async function PostMainBlock({
  c,
  dict,
  locale,
  post,
}: {
  c: { productsTitle?: string; boxTitle?: string; boxBody?: string; boxCta?: string };
  dict: Dictionary;
  locale: Locale;
  post: Post;
}) {
  const t = dict.insights;
  const localeTag = localeTags[locale];
  const products = post.product_slugs.length ? await getProducts() : [];
  // Keep the order chosen in the CMS; slugs of removed products are skipped.
  const related = post.product_slugs.flatMap((slug) => products.filter((p) => p.slug === slug));
  const cover = post.cover ?? photos.hillside;

  return (
    <>
      <div className="bg-forest pt-28" />
      <article className="py-10 md:py-14">
        <div className="container-page">
          <nav aria-label={dict.common.breadcrumb} className="flex items-center gap-1.5 text-sm text-muted">
            <Link href="/insights" className="hover:text-forest">
              {t.eyebrow}
            </Link>
            <ChevronRight className="size-3.5 rtl:-scale-x-100" />
            <Link href={`/insights?category=${post.category}`} className="hover:text-forest">
              {t.categories[post.category]}
            </Link>
          </nav>
          <header data-reveal-stagger className="mt-8 max-w-3xl">
            <p className="text-sm text-muted">
              <span className="rounded-full bg-lime px-3 py-1 text-xs font-medium text-forest">{t.categories[post.category]}</span>
              <span className="ms-3">
                <time dateTime={post.published_at}>{formatDate(post.published_at, localeTag)}</time>
                <span aria-hidden> · </span>
                {format(t.minRead, { n: readingMinutes(post.body) })}
              </span>
            </p>
            <h1 className="mt-5 text-4xl leading-[1.1] font-medium tracking-tight text-balance text-forest md:text-5xl">{post.title}</h1>
            {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-forest/75 md:text-xl">{post.excerpt}</p>}
          </header>
          <div data-reveal-image className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl bg-mist md:aspect-[21/9]">
            <Image src={cover} alt="" fill loading="eager" fetchPriority="high" sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,42rem)_1fr] lg:gap-16">
            <ArticleBody source={post.body} />
            <aside className="space-y-4 self-start lg:sticky lg:top-28">
              {related.length > 0 && (
                <div className="rounded-3xl bg-white p-5">
                  <h2 className="px-1 text-sm font-medium text-forest">{c.productsTitle || t.productsTitle}</h2>
                  <ul className="mt-3 space-y-1">
                    {related.map((product) => (
                      <li key={product.slug}>
                        <Link href={`/products/${product.slug}`} className="group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-sand">
                          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mist">
                            <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm leading-snug font-medium text-forest">{product.name}</span>
                            <span className="block truncate text-xs text-muted">{product.grade}</span>
                          </span>
                          <ArrowUpRight className="size-4 shrink-0 text-muted transition-colors group-hover:text-forest rtl:-scale-x-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {c.boxTitle && (
                <div className="rounded-3xl bg-forest p-6 text-white">
                  <p className="text-lg font-medium">{c.boxTitle}</p>
                  {c.boxBody && <p className="mt-1.5 text-sm leading-relaxed text-white/70">{c.boxBody}</p>}
                  {c.boxCta && (
                    <ButtonLink href="/contact" variant="lime" arrow className="mt-5">
                      {c.boxCta}
                    </ButtonLink>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}

/** Three more articles, same topic first. */
export async function PostMoreBlock({
  c,
  dict,
  locale,
  post,
}: {
  c: { title?: string; accent?: string; allArticles?: string };
  dict: Dictionary;
  locale: Locale;
  post: Post;
}) {
  const posts = await getPosts();
  const more = [...posts.filter((p) => p.slug !== post.slug && p.category === post.category), ...posts.filter((p) => p.slug !== post.slug && p.category !== post.category)].slice(0, 3);
  if (more.length === 0) return null;
  const t = dict.insights;
  return (
    <section className="bg-white py-20">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading title={c.title ?? ""} accent={c.accent || undefined} />
          {c.allArticles && (
            <ButtonLink href="/insights" variant="outline-dark" arrow>
              {c.allArticles}
            </ButtonLink>
          )}
        </div>
        <ul data-reveal-stagger className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((p) => (
            <li key={p.slug}>
              <PostCard post={p} categoryLabel={t.categories[p.category]} minRead={t.minRead} localeTag={localeTags[locale]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
