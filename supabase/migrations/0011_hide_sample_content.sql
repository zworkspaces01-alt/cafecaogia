-- Takes the starter placeholder content off the public site: the invented testimonials, the unverified
-- certifications and the sample CEO profile (every row still marked is_sample). Rows are unpublished,
-- not deleted — tick "Hiển thị" in the admin to bring one back once it is real. With no published
-- testimonials the homepage hides that section; with no certifications it shows "documents on request";
-- with no published CEO the /about-ceo page and its links disappear.
-- Also aligns the homepage stats with the site: 34 export grades in the catalog, and the five sourcing
-- provinces named on product pages (Dak Lak, Gia Lai, Lam Dong, Binh Phuoc, Dong Nai).
-- Safe to run more than once.

update public.testimonials set published = false where is_sample and published;
update public.certifications set published = false where is_sample and published;
update public.team_members set published = false where is_sample and is_ceo and published;

update public.site_settings
set data = jsonb_set(
  data,
  '{stats}',
  (
    select jsonb_agg(
      case
        when stat->'label'->>'en' = 'Export grades in our catalog' then jsonb_set(stat, '{value}', '"34"')
        when stat->'label'->>'en' = 'Sourcing regions' then jsonb_build_object(
          'value', '5',
          'label', jsonb_build_object('en', 'Sourcing provinces', 'ru', 'Провинций закупок', 'ar', 'مقاطعات توريد')
        )
        else stat
      end
      order by ordinality
    )
    from jsonb_array_elements(data->'stats') with ordinality as s(stat, ordinality)
  )
)
where data ? 'stats';
