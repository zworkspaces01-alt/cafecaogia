-- SEO & analytics.
-- Site-wide SEO and tracking IDs live in site_settings.data (keys "seo" and "analytics"), so they
-- need no schema change. This migration adds:
--   • per-product search title/description (English here, Russian/Arabic in `translations`)
--   • lead attribution on inquiries: UTM tags, referrer and landing page captured in the browser
--     { "source", "medium", "campaign", "term", "content", "click", "referrer", "landing", "at" }

alter table public.products
  add column if not exists seo_title       text not null default '',
  add column if not exists seo_description text not null default '';

alter table public.inquiries
  add column if not exists attribution jsonb;

alter table public.inquiries drop constraint if exists inquiries_attribution_size;
alter table public.inquiries add constraint inquiries_attribution_size
  check (attribution is null or pg_column_size(attribution) <= 4096);
