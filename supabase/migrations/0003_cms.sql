-- CMS: admin access, editable content tables and site settings.
-- Every content table has:
--   translations jsonb  { "ru": { …fields }, "ar": { …fields } } — missing fields fall back to English
--   is_sample   boolean  placeholder content to replace before launch (listed on the admin dashboard)
--   published   boolean  only published rows are visible on the website

-- ── Admins ──────────────────────────────────────────────────────────────────
-- Add editors with: insert into public.admin_users (email) values ('you@example.com');
create table if not exists public.admin_users (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- No policies: the list is managed from the SQL editor only.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ── Existing tables: admin access ───────────────────────────────────────────
alter table public.products add column if not exists is_sample boolean not null default false;

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read inquiries" on public.inquiries;
create policy "Admins read inquiries" on public.inquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins update inquiries" on public.inquiries;
create policy "Admins update inquiries" on public.inquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete inquiries" on public.inquiries;
create policy "Admins delete inquiries" on public.inquiries
  for delete to authenticated using (public.is_admin());

-- ── Content tables ──────────────────────────────────────────────────────────
create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  quote        text not null,
  name         text not null,
  role         text not null default '',
  company      text not null default '',
  country      text not null default '',
  flag         text not null default '',
  product_slug text,
  since        int,
  rating       int not null default 5 check (rating between 1 and 5),
  image        text,
  logo         text,
  translations jsonb not null default '{}',
  is_sample    boolean not null default false,
  published    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.partners (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  logo       text,
  country    text not null default '',
  style      text not null default 'sans' check (style in ('serif', 'sans', 'mono', 'script')),
  url        text,
  is_sample  boolean not null default false,
  published  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certifications (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  issuer       text not null default '',
  year         int,
  scope        text not null default '',
  logo         text,
  file         text,
  translations jsonb not null default '{}',
  is_sample    boolean not null default false,
  published    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.team_members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  role         text not null default '',
  bio          text[] not null default '{}',
  quote        text not null default '',
  photo        text,
  email        text not null default '',
  whatsapp     text not null default '',
  is_ceo       boolean not null default false,
  translations jsonb not null default '{}',
  is_sample    boolean not null default false,
  published    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Single row (id = 1) holding company details, contacts, socials, memberships and stats.
create table if not exists public.site_settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['testimonials', 'partners', 'certifications', 'team_members', 'site_settings'] loop
    execute format('drop trigger if exists %1$s_touch on public.%1$I', t);
    execute format('create trigger %1$s_touch before update on public.%1$I for each row execute function public.touch_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Admins manage %1$s" on public.%1$I', t);
    execute format('create policy "Admins manage %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  foreach t in array array['testimonials', 'partners', 'certifications', 'team_members'] loop
    execute format('drop policy if exists "Public reads published %1$s" on public.%1$I', t);
    execute format('create policy "Public reads published %1$s" on public.%1$I for select to anon, authenticated using (published)', t);
    execute format('create index if not exists %1$s_order_idx on public.%1$I (sort_order)', t);
  end loop;
end $$;

drop policy if exists "Public reads site settings" on public.site_settings;
create policy "Public reads site settings" on public.site_settings
  for select to anon, authenticated using (true);
