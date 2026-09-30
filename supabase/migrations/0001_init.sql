-- Cao Gia: products catalog + buyer inquiries

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  category    text not null check (category in ('coffee', 'cashew')),
  grade       text not null default '',
  summary     text not null default '',
  description text not null default '',
  image       text not null,               -- Cloudinary public ID or absolute URL
  gallery     text[] not null default '{}',
  origin      text not null default '',
  specs       jsonb not null default '[]', -- [{ "label": "Moisture", "value": "12.5% max" }]
  packaging   text not null default '',
  moq         text not null default '',
  featured    boolean not null default false,
  published   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category, sort_order);

create table if not exists public.inquiries (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name) between 1 and 120),
  company      text check (char_length(company) <= 160),
  email        text not null check (char_length(email) <= 200),
  phone        text check (char_length(phone) <= 40),
  country      text not null check (char_length(country) <= 80),
  product_slug text,
  quantity     text check (char_length(quantity) <= 80),
  incoterm     text check (char_length(incoterm) <= 10),
  message      text not null check (char_length(message) between 1 and 4000),
  status       text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'won', 'lost'))
);

create index if not exists inquiries_created_idx on public.inquiries (created_at desc);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- Row Level Security: the website uses the anon key, so it can only
-- read published products and create (never read) inquiries.
alter table public.products  enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products" on public.products
  for select to anon, authenticated using (published = true);

drop policy if exists "Public can submit inquiries" on public.inquiries;
create policy "Public can submit inquiries" on public.inquiries
  for insert to anon, authenticated with check (status = 'new');
