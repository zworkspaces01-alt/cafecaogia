-- Certifications confirmed by Cao Gia (October 2026): HACCP, ISO 22000, Halal and FDA registration, all
-- held by the partner processing facility. These rows become real (is_sample = false) with that scope and
-- no invented year; the other placeholders (Rainforest Alliance, and SGS / Vinacontrol / Cafecontrol,
-- which are inspections rather than certifications) stay hidden. Add certificate numbers, years and PDFs
-- in the admin. Works before or after 0011, and is safe to run more than once.

update public.certifications as c
set
  is_sample = false,
  published = true,
  year = null,
  scope = v.scope,
  translations = jsonb_build_object(
    'ru', coalesce(c.translations->'ru', '{}'::jsonb) || jsonb_build_object('scope', v.scope_ru),
    'ar', coalesce(c.translations->'ar', '{}'::jsonb) || jsonb_build_object('scope', v.scope_ar)
  ),
  sort_order = v.sort_order
from (values
  ('HACCP', 'Held by our partner processing facility', 'Сертификат перерабатывающего предприятия-партнёра', 'شهادة لدى منشأة المعالجة الشريكة لنا', 10),
  ('ISO 22000', 'Held by our partner processing facility', 'Сертификат перерабатывающего предприятия-партнёра', 'شهادة لدى منشأة المعالجة الشريكة لنا', 20),
  ('Halal', 'Held by our partner processing facility', 'Сертификат перерабатывающего предприятия-партнёра', 'شهادة لدى منشأة المعالجة الشريكة لنا', 30),
  ('FDA Registered', 'Our partner processing facility is registered with the U.S. FDA', 'Предприятие-партнёр зарегистрировано в FDA США', 'منشأة المعالجة الشريكة مسجّلة لدى إدارة الغذاء والدواء الأمريكية', 40)
) as v(name, scope, scope_ru, scope_ar, sort_order)
where c.name = v.name;

update public.certifications
set published = false
where name in ('Rainforest Alliance', 'SGS Inspection', 'Vinacontrol', 'Cafecontrol') and is_sample;
