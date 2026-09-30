import { Mail, MapPin } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import Link from "@/components/link";
import { Logo } from "@/components/logo";
import { getDictionary } from "@/i18n/server";
import { getCeo, getSettings, whatsappLink } from "@/lib/content";

export async function SiteFooter() {
  const [dict, settings, ceo] = await Promise.all([getDictionary(), getSettings(), getCeo()]);
  const { links } = dict.footer;
  const { company, contact } = settings;

  const columns = [
    {
      title: dict.footer.coffee,
      links: [
        { href: "/products/robusta-grade-1-screen-18", label: links.robusta },
        { href: "/products/arabica-cau-dat-screen-18", label: links.arabica },
        { href: "/products/fine-robusta-honey-process", label: links.fineRobusta },
        { href: "/products/roasted-coffee-private-label", label: links.privateLabel },
      ],
    },
    {
      title: dict.footer.cashew,
      links: [
        { href: "/products/cashew-kernels-w240", label: links.w240 },
        { href: "/products/cashew-kernels-w320", label: links.w320 },
        { href: "/products/cashew-splits-and-pieces", label: links.splits },
        { href: "/products/roasted-salted-cashews", label: links.roasted },
      ],
    },
    {
      title: dict.footer.company,
      links: [
        { href: "/about", label: dict.nav.about },
        ...(ceo ? [{ href: "/about-ceo", label: links.leadership }] : []),
        { href: "/process", label: dict.nav.process },
        { href: "/products", label: links.allProducts },
        { href: "/company-profile", label: links.profile },
        { href: "/contact", label: dict.common.requestQuote },
      ],
    },
  ];

  const { address } = contact;
  const socialNames: Record<keyof typeof settings.socials, string> = { linkedin: "LinkedIn", facebook: "Facebook", youtube: "YouTube" };
  const socials = (Object.entries(settings.socials) as [keyof typeof settings.socials, string][])
    .filter(([, url]) => url)
    .map(([key, url]) => [socialNames[key], url] as const);

  return (
    <footer className="bg-ink text-white print:hidden">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div data-reveal className="max-w-sm">
          <Logo label={dict.common.homeLabel} tagline="Coffee · Cashew · Vietnam" />
          <p className="mt-5 text-sm leading-relaxed text-white/60">{dict.footer.description}</p>
          <ul className="mt-6 space-y-3 text-sm text-white/80">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-lime" />
              <span dir="ltr">
                {address.street}, {address.locality}, {address.country}
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-lime" />
              <a href={`mailto:${contact.email}`} className="hover:text-lime">
                {contact.email}
              </a>
            </li>
            <li className="flex gap-3">
              <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-[#25d366]" />
              <a
                href={whatsappLink(contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-lime"
                dir="ltr"
              >
                {contact.whatsapp}
              </a>
            </li>
          </ul>
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-lime hover:text-lime"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div data-reveal-stagger className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-medium text-lime">{col.title}</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 pt-6 pb-24 text-xs text-white/50 sm:flex-row sm:justify-between lg:pb-6">
          <p>
            © {new Date().getFullYear()} <span dir="ltr">{company.legalName}</span> · {dict.footer.enterpriseCode}{" "}
            <span dir="ltr">{company.enterpriseCode}</span>. {dict.footer.rights}
          </p>
          <p>{dict.footer.proudly} 🇻🇳</p>
        </div>
      </div>
    </footer>
  );
}
