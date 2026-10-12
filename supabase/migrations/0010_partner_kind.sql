-- Partners now feed the closing "industry leaders" logo strip on the homepage. Each gets a kind
-- (bank / shipping line / other) shown under its logo, and the invented placeholder partners are
-- replaced by the bank and shipping lines Cao Gia works with. Logos are served from /public/partners.
-- Safe to run more than once.

alter table public.partners
  add column if not exists kind text not null default 'other' check (kind in ('bank', 'shipping', 'other'));

delete from public.partners where is_sample;

insert into public.partners (name, logo, country, style, kind, url, is_sample, published, sort_order)
select * from (values
  ('HSBC', '/partners/hsbc.png', '🇬🇧', 'sans', 'bank', null, false, true, 10),
  ('MAERSK', null, '🇩🇰', 'sans', 'shipping', null, false, true, 20),
  ('CMA CGM', '/partners/cma-cgm.png', '🇫🇷', 'sans', 'shipping', null, false, true, 30),
  ('COSCO SHIPPING', '/partners/cosco-shipping.png', '🇨🇳', 'sans', 'shipping', null, false, true, 40),
  ('EVERGREEN', '/partners/evergreen.png', '🇹🇼', 'sans', 'shipping', null, false, true, 50),
  ('ONE', '/partners/one.png', '🇯🇵', 'sans', 'shipping', null, false, true, 60)
) as v(name, logo, country, style, kind, url, is_sample, published, sort_order)
where not exists (select 1 from public.partners p where p.name = v.name);
