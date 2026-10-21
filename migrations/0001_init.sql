-- Cao Gia CMS schema on Cloudflare D1 (SQLite). Applied with `wrangler d1 migrations apply DB`.
-- Ported from the former Supabase (Postgres) schema:
--   uuid → TEXT (lower-hex, generated here or in the app), timestamptz → ISO-8601 TEXT,
--   boolean → INTEGER 0/1, text[] and jsonb → JSON TEXT. Access control lives in the app
--   (D1 has no row-level security): public reads filter on `published`, writes go through requireAdmin().

create table products (
  id              text primary key default (lower(hex(randomblob(16)))),
  slug            text not null unique,
  name            text not null,
  category        text not null check (category in ('coffee', 'cashew')),
  grade           text not null default '',
  summary         text not null default '',
  description     text not null default '',
  image           text not null,                 -- Cloudinary public ID or absolute URL
  gallery         text not null default '[]',    -- JSON string[]
  origin          text not null default '',
  specs           text not null default '[]',    -- JSON [{ "label": "Moisture", "value": "12.5% max" }]
  packaging       text not null default '',
  moq             text not null default '',
  featured        integer not null default 0,
  published       integer not null default 1,
  sort_order      integer not null default 0,
  translations    text not null default '{}',    -- JSON { ru: {...}, ar: {...} }
  is_sample       integer not null default 0,
  seo_title       text not null default '',
  seo_description text not null default '',
  created_at      text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index products_category_idx on products (category, sort_order);

create table inquiries (
  id           text primary key default (lower(hex(randomblob(16)))),
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name         text not null check (length(name) between 1 and 120),
  company      text check (length(company) <= 160),
  email        text not null check (length(email) <= 200),
  phone        text check (length(phone) <= 40),
  country      text check (length(country) <= 80),
  product_slug text,
  quantity     text check (length(quantity) <= 80),
  incoterm     text check (length(incoterm) <= 10),
  message      text not null check (length(message) between 1 and 4000),
  status       text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'won', 'lost')),
  locale       text not null default 'en' check (locale in ('en', 'ru', 'ar')),
  attribution  text check (attribution is null or length(attribution) <= 4096) -- JSON
);
create index inquiries_created_idx on inquiries (created_at desc);

-- CMS accounts. password_hash is "pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>" (src/lib/admin/password.ts).
create table admin_users (
  email         text primary key collate nocase,
  password_hash text not null,
  created_at    text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table testimonials (
  id           text primary key default (lower(hex(randomblob(16)))),
  quote        text not null,
  name         text not null,
  role         text not null default '',
  company      text not null default '',
  country      text not null default '',
  flag         text not null default '',
  product_slug text,
  since        integer,
  rating       integer not null default 5 check (rating between 1 and 5),
  image        text,
  logo         text,
  translations text not null default '{}',
  is_sample    integer not null default 0,
  published    integer not null default 1,
  sort_order   integer not null default 0,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index testimonials_order_idx on testimonials (sort_order);

create table partners (
  id         text primary key default (lower(hex(randomblob(16)))),
  name       text not null,
  logo       text,
  country    text not null default '',
  style      text not null default 'sans' check (style in ('serif', 'sans', 'mono', 'script')),
  kind       text not null default 'other' check (kind in ('bank', 'shipping', 'other')),
  url        text,
  is_sample  integer not null default 0,
  published  integer not null default 1,
  sort_order integer not null default 0,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index partners_order_idx on partners (sort_order);

create table certifications (
  id           text primary key default (lower(hex(randomblob(16)))),
  name         text not null,
  issuer       text not null default '',
  year         integer,
  scope        text not null default '',
  logo         text,
  file         text,
  translations text not null default '{}',
  is_sample    integer not null default 0,
  published    integer not null default 1,
  sort_order   integer not null default 0,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index certifications_order_idx on certifications (sort_order);

create table team_members (
  id           text primary key default (lower(hex(randomblob(16)))),
  name         text not null,
  role         text not null default '',
  bio          text not null default '[]',      -- JSON string[]
  quote        text not null default '',
  photo        text,
  email        text not null default '',
  whatsapp     text not null default '',
  is_ceo       integer not null default 0,
  translations text not null default '{}',
  is_sample    integer not null default 0,
  published    integer not null default 1,
  sort_order   integer not null default 0,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index team_members_order_idx on team_members (sort_order);

create table site_settings (
  id         integer primary key default 1 check (id = 1),
  data       text not null default '{}',        -- JSON: company, contact, socials, stats, seo, analytics, notifications
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table posts (
  id            text primary key default (lower(hex(randomblob(16)))),
  slug          text not null unique,
  title         text not null,
  excerpt       text not null default '',
  body          text not null default '',
  cover         text,
  category      text not null default 'guide' check (category in ('guide', 'market', 'news')),
  published_at  text not null default (date('now')),
  product_slugs text not null default '[]',     -- JSON string[]
  translations  text not null default '{}',
  is_sample     integer not null default 0,
  published     integer not null default 1,
  sort_order    integer not null default 0,
  created_at    text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index posts_published_at_idx on posts (published_at desc);
