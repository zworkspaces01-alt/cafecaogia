import { Anchor, CalendarClock, Container, CreditCard, PackageCheck, Scale } from "lucide-react";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getDictionary } from "@/i18n/server";

const icons = [Scale, Container, CalendarClock, Anchor, CreditCard, PackageCheck];

export async function TradeTerms() {
  const { tradeTerms: t } = await getDictionary();

  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          accent={t.accent}
          description={t.description}
        />

        <ul data-reveal-stagger className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((term, i) => {
            const Icon = icons[i % icons.length];
            return (
              <li key={term.label} className="group flex gap-4 rounded-3xl bg-white p-6 transition-colors hover:bg-forest">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand text-forest transition-colors group-hover:bg-lime">
                  <Icon className="size-5" />
                </span>
                <div className="flex flex-col">
                  <p className="text-sm text-muted transition-colors group-hover:text-white/60">{term.label}</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight text-forest transition-colors group-hover:text-white">
                    {term.value}
                  </p>
                  <p className="mt-1 text-sm text-muted transition-colors group-hover:text-white/70">{term.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div data-reveal className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-mist px-6 py-5">
          <p className="text-sm text-muted">
            {t.tailoredLead} <span className="text-forest">{t.tailoredEmphasis}</span>
          </p>
          <ButtonLink href="/contact" variant="dark" arrow>
            {t.tailoredCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
