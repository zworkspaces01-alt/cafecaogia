-- Localized product copy for the Russian and Arabic sites.
-- Shape: { "ru": { "name": "...", "summary": "...", "specs": [{ "label": "...", "value": "..." }], ... }, "ar": { ... } }
-- Any field left out falls back to the English columns.
alter table public.products
  add column if not exists translations jsonb not null default '{}';

-- Language of the site the inquiry was sent from, so sales can reply in the buyer's language.
alter table public.inquiries
  add column if not exists locale text not null default 'en' check (locale in ('en', 'ru', 'ar'));
