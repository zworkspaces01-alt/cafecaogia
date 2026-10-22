-- Page builder: pages made of ordered content blocks, with a working draft and a history of published
-- versions. System pages (home, about, process, green-coffee, cashew-kernels) have a `key`; custom pages
-- only a `slug`. A system page with no row renders its default layout from code.
-- Drafts and versions are read by the CMS (requireAdmin) and Draft Mode previews only; public pages
-- read published rows. The slug format is checked in the app (slugPattern in src/lib/blocks/types.ts).

create table pages (
  id           text primary key default (lower(hex(randomblob(16)))),
  key          text unique,
  slug         text not null unique,
  title        text not null,
  blocks       text not null default '[]', -- JSON Block[]
  seo          text not null default '{}', -- JSON PageSeo
  published    integer not null default 0,
  published_at text,
  created_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table page_drafts (
  page_id    text primary key references pages (id) on delete cascade,
  blocks     text not null default '[]',
  seo        text not null default '{}',
  updated_by text not null default '',
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table page_versions (
  id           text primary key default (lower(hex(randomblob(16)))),
  page_id      text not null references pages (id) on delete cascade,
  blocks       text not null,
  seo          text not null default '{}',
  published_by text not null default '',
  published_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index page_versions_page_idx on page_versions (page_id, published_at desc);
