-- Studio: the CMS rebuilt on the model of VSAP Studio. Every edit is a draft until one Publish puts
-- the chosen changes live; each Publish is kept as a release that can be undone. Accounts get roles,
-- sign-ins and changes go to an audit log, and quote requests get an internal note.

-- Unpublished edits to products, posts, testimonials, partners, certifications and team members, one
-- row per edited record (page drafts stay in page_drafts). A new record lives only here until its
-- first publish (the app picks its id); `deleted` = a removal waiting to be published.
create table record_drafts (
  entity     text not null,                     -- entity key in src/lib/admin/entities.ts
  record_id  text not null,
  data       text not null default '{}',        -- JSON: the record's fields as edited
  deleted    integer not null default 0,
  updated_by text not null default '',
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (entity, record_id)
);

-- One row per Publish: who, when, the note and what changed, with each item's previous state so the
-- release can be undone (loaded back into the drafts).
create table releases (
  id           text primary key default (lower(hex(randomblob(16)))),
  published_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_by text not null default '',
  note         text not null default '',
  items        text not null default '[]'       -- JSON [{ key, kind, title, action, before }]
);
create index releases_published_idx on releases (published_at desc);

-- Roles: admin | publisher | editor | sales (src/lib/admin/roles.ts). Existing accounts stay admins.
alter table admin_users add column name text not null default '';
alter table admin_users add column role text not null default 'admin';
alter table admin_users add column disabled integer not null default 0;
-- Sessions started before this moment are refused: set when the password, role or access changes.
alter table admin_users add column sessions_from text;

create table audit_log (
  id     integer primary key autoincrement,
  at     text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor  text not null default '',
  action text not null,                         -- labels in src/lib/admin/audit.ts
  target text not null default '',
  detail text not null default ''
);
create index audit_log_at_idx on audit_log (at desc);
create index audit_log_action_idx on audit_log (action, target, at);

alter table inquiries add column note text not null default '';
