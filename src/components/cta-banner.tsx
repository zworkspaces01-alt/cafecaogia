import Image from "next/image";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { Mail } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { format } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { getContacts, getSettings, whatsappLink } from "@/lib/content";
import { photos } from "@/lib/site";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

export async function CtaBanner() {
  const [dict, contacts, settings] = await Promise.all([getDictionary(), getContacts(), getSettings()]);
  const t = dict.cta;
  const email = settings.contact.email;

  return (
    <section className="pb-20 md:pb-28">
      <div className="container-page">
        <div
          data-reveal-image
          className="relative isolate grid gap-10 overflow-hidden rounded-3xl bg-forest px-6 py-14 text-white md:px-14 md:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center"
        >
          <div data-parallax className="absolute inset-x-0 -top-[15%] -bottom-[15%] -z-10">
            <Image src={photos.portSunset} alt="" fill sizes="100vw" className="object-cover opacity-70" />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/85 to-forest/40 rtl:bg-gradient-to-l" />

          <div data-reveal-stagger>
            <h2 className="text-4xl leading-[1.05] font-medium tracking-tight md:text-5xl">
              {t.title}
              <br />
              <em className="font-serif font-normal text-lime">{t.accent}</em>
            </h2>
            <p className="mt-5 max-w-xl text-white/75">{t.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/contact" arrow>
                {dict.common.requestQuote}
              </ButtonLink>
              <ButtonLink href={`mailto:${email}`} variant="outline-light">
                {email}
              </ButtonLink>
            </div>
          </div>

          {contacts.length > 0 && (
            <div data-reveal-stagger className="grid gap-3">
              <p className="text-sm text-white/70">{t.talkDirect}</p>
              {contacts.map((person) => (
                <div
                  key={person.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
                >
                  {person.photo ? (
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-full">
                      <Image src={person.photo} alt={person.name} fill sizes="48px" className="object-cover" />
                    </span>
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-lime font-medium text-forest">
                      {initials(person.name) || "CG"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{person.name}</span>
                    <span className="block text-xs text-white/65">
                      {person.role} · {t.languages}
                    </span>
                  </span>
                  {/* On phones the buttons drop below the name so the role isn't squeezed. */}
                  <span className="flex w-full gap-2 ps-16 sm:w-auto sm:ps-0">
                    <a
                      href={`mailto:${person.email}`}
                      aria-label={format(t.emailPerson, { name: person.name })}
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-white/25 transition-colors hover:bg-white hover:text-forest"
                    >
                      <Mail className="size-4" />
                    </a>
                    <a
                      href={whatsappLink(person.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={format(t.whatsappPerson, { name: person.name })}
                      className="grid size-11 shrink-0 place-items-center rounded-full bg-[#25d366] text-white transition-opacity hover:opacity-90"
                    >
                      <WhatsAppIcon className="size-4" />
                    </a>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
