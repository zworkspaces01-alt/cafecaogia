"use client";

import { useActionState, useEffect } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { readAttribution, track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-mist bg-sand px-4 py-3 text-base text-forest outline-none sm:text-sm transition placeholder:text-muted/70 focus:border-leaf focus:bg-white focus:ring-2 focus:ring-lime/60";

function Field({
  label,
  name,
  error,
  required,
  children,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-forest">
        {label}
        {required && <span className="text-leaf"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function InquiryForm({
  locale,
  t,
  defaultProduct,
  defaultMessage,
}: {
  locale: Locale;
  t: Dictionary["form"];
  defaultProduct?: string;
  defaultMessage?: string;
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const errors = state.fieldErrors ?? {};

  // Attach where the visitor came from (read at submit time: it lives in localStorage).
  const submit = (form: FormData) => {
    form.set("attribution", JSON.stringify(readAttribution() ?? {}));
    action(form);
  };

  useEffect(() => {
    if (state.status === "success") track("generate_lead", { form: "inquiry", product: defaultProduct });
  }, [state.status, defaultProduct]);

  if (state.status === "success") {
    return (
      <div className="flex animate-rise flex-col items-center rounded-3xl bg-white p-10 text-center md:p-14" role="status">
        <CheckCircle2 className="size-12 animate-[pop_0.6s_0.2s_cubic-bezier(0.3,1.6,0.5,1)_both] text-leaf" />
        <h2 className="mt-5 text-2xl font-medium text-forest">{t.successTitle}</h2>
        <p className="mt-3 max-w-md text-muted">{t.successBody}</p>
      </div>
    );
  }

  const describedBy = (name: keyof typeof errors) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form action={submit} data-reveal className="relative rounded-3xl bg-white p-6 md:p-10" noValidate>
      <input type="hidden" name="lang" value={locale} />
      {defaultProduct && <input type="hidden" name="product" value={defaultProduct} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.name} name="name" required error={errors.name} className="sm:col-span-2">
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={!!errors.name}
            aria-describedby={describedBy("name")}
            className={inputClass}
          />
        </Field>
        <Field label={t.email} name="email" required error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email")}
            className={inputClass}
          />
        </Field>
        <Field label={t.phone} name="phone">
          <input id="phone" name="phone" type="tel" autoComplete="tel" dir="ltr" className={cn(inputClass, "text-start rtl:text-end")} />
        </Field>
        <Field label={t.message} name="message" required error={errors.message} className="sm:col-span-2">
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            defaultValue={defaultMessage}
            placeholder={t.messagePlaceholder}
            aria-invalid={!!errors.message}
            aria-describedby={describedBy("message")}
            className={cn(inputClass, "resize-y")}
          />
        </Field>

        {/* Honeypot — hidden from people, tempting for bots */}
        <div aria-hidden className="pointer-events-none absolute start-0 top-0 size-px overflow-hidden opacity-0">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {state.status === "error" && state.message && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{t.privacy}</p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-forest px-7 text-sm font-medium text-white transition-colors hover:bg-leaf disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 rtl:-scale-x-100" />}
          {pending ? t.sending : t.submit}
        </button>
      </div>
    </form>
  );
}
