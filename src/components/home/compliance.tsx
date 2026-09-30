import { ArrowUpRight, CheckCircle2, FileCheck2, MapPinned } from "lucide-react";
import { CertBadge } from "@/components/cert-badge";
import { SectionHeading } from "@/components/ui";
import { getDictionary } from "@/i18n/server";
import { getCertifications } from "@/lib/content";

export async function Compliance() {
  const [{ compliance: t }, certifications] = await Promise.all([getDictionary(), getCertifications()]);

  return (
    <section className="bg-forest py-20 text-white md:py-28">
      <div className="container-page">
        <SectionHeading tone="light" eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} />

        {certifications.length > 0 ? (
          <ul data-reveal-stagger className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {certifications.map((cert) => (
              <li
                key={cert.id}
                className="group flex flex-col items-center rounded-3xl bg-white/[0.06] px-4 py-8 text-center ring-1 ring-white/10 transition-colors hover:bg-white/10"
              >
                <CertBadge
                  name={cert.name}
                  logo={cert.logo}
                  className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
                />
                <p className="mt-5 font-serif text-xl">{cert.name}</p>
                <p className="mt-1 text-xs text-white/55">
                  {[cert.issuer, cert.year].filter(Boolean).join(" · ")}
                </p>
                {cert.scope && <p className="mt-3 text-xs leading-relaxed text-white/65">{cert.scope}</p>}
                {cert.file && (
                  <a
                    href={cert.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-lime hover:text-white"
                  >
                    {t.viewCertificate} <ArrowUpRight className="size-3.5 rtl:-scale-x-100" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div data-reveal className="mt-12 rounded-3xl bg-white/[0.06] p-8 ring-1 ring-white/10">
            <FileCheck2 className="size-9 text-lime" />
            <p className="mt-6 text-2xl font-medium tracking-tight">{t.onRequestTitle}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">{t.onRequestBody}</p>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div data-reveal className="rounded-3xl bg-lime p-6 text-forest md:p-8">
            <MapPinned className="size-8" />
            <p className="mt-6 text-2xl font-medium tracking-tight">
              {t.eudrTitle} <em className="font-serif font-normal">{t.eudrAccent}</em>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-forest/75">{t.eudrBody}</p>
          </div>
          <div data-reveal className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 md:p-8">
            <p className="font-medium">{t.documentsTitle}</p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {t.documents.map((doc) => (
                <li key={doc} className="flex gap-2.5 text-sm text-white/75">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-lime" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
