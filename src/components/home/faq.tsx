import { Plus } from "lucide-react";
import Link from "@/components/link";
import { SectionHeading } from "@/components/ui";
import { getDictionary } from "@/i18n/server";
import { getSettings } from "@/lib/content";

/** `surface` keeps section backgrounds alternating when a neighbouring section is hidden. */
export async function Faq({ surface = "white" }: { surface?: "white" | "sand" }) {
  const [{ faq: t }, settings] = await Promise.all([getDictionary(), getSettings()]);
  const email = settings.contact.email;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className={surface === "white" ? "bg-white py-20 md:py-28" : "py-20 md:py-28"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <SectionHeading eyebrow={t.eyebrow} title={t.title} accent={t.accent} />
          <p data-reveal className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted">
            {t.cantFind}{" "}
            <a href={`mailto:${email}`} className="text-forest underline underline-offset-4">
              {email}
            </a>{" "}
            {t.or}{" "}
            <Link href="/contact" className="text-forest underline underline-offset-4">
              {t.sendRequirements}
            </Link>
            .
          </p>
        </div>

        <div data-reveal-stagger className="divide-y divide-mist border-y border-mist">
          {t.items.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-start text-base font-medium text-forest md:text-lg [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand transition-all group-open:rotate-45 group-open:bg-lime">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
