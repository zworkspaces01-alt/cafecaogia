import { ButtonLink } from "@/components/ui";
import { getDictionary } from "@/i18n/server";

export default async function NotFound() {
  const { notFound: t } = await getDictionary();

  return (
    <section className="bg-forest pt-40 pb-28 text-white">
      <div className="container-page max-w-2xl text-center">
        <p className="text-sm tracking-[0.2em] text-lime uppercase">404</p>
        <h1 className="mt-4 text-5xl font-medium tracking-tight">
          {t.title} <em className="font-serif font-normal">{t.accent}</em>
        </h1>
        <p className="mt-5 text-white/75">{t.body}</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">{t.home}</ButtonLink>
          <ButtonLink href="/products" variant="outline-light">
            {t.browse}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
