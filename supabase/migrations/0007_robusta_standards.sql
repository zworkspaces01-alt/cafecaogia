-- Robusta export standards (Cao Gia, Sept 2026).
-- Brings the live catalog in line with src/data/products.ts; seed.sql only fills an empty table.
--   • G1 Screen 18 and G1 Screen 16 (natural): foreign matter 0.5%, black & broken 2%, other coffee beans 0.5%
--   • G2 Screen 13 (natural): 90% on screen, other coffee beans 1%, bulk loading 21.6 MT
--   • new: Fully washed Special G1, Screen 16 / 18
-- Only specs and MOQ are replaced (plus their Russian/Arabic copies); other CMS edits are kept.
-- Safe to run more than once.

update public.products set
  specs = '[{"label":"Moisture","value":"12.5% max"},{"label":"Foreign matter","value":"0.5% max"},{"label":"Black & broken","value":"2% max"},{"label":"Other coffee beans","value":"0.5% max"},{"label":"Bean size","value":"90% above Screen 18 (7.1 mm)"},{"label":"Processing","value":"Natural (dry), polished"},{"label":"Grade","value":"G1 · Screen 18 Clean"}]'::jsonb,
  moq = '1 × 20ft container (19.2 MT)',
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Посторонние примеси","value":"не более 0,5%"},{"label":"Чёрные и битые зёрна","value":"не более 2%"},{"label":"Зёрна других видов кофе","value":"не более 0,5%"},{"label":"Размер зерна","value":"90% выше скрина 18 (7,1 мм)"},{"label":"Обработка","value":"Натуральная (сухая), с полировкой"},{"label":"Сорт","value":"G1 · скрин 18, очищенная"}],"moq":"1 × 20ft контейнер (19,2 т)"}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"المواد الغريبة","value":"0.5% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"2% كحد أقصى"},{"label":"حبوب قهوة من أنواع أخرى","value":"0.5% كحد أقصى"},{"label":"حجم الحبة","value":"90% فوق غربال 18 (7.1 مم)"},{"label":"المعالجة","value":"طبيعية (جافة) مع التلميع"},{"label":"الدرجة","value":"G1 · غربال 18 نظيفة"}],"moq":"حاوية 20 قدم واحدة (19.2 طن)"}'::jsonb
  ),
  updated_at = now()
where slug = 'robusta-s18-clean';

update public.products set
  specs = '[{"label":"Moisture","value":"12.5% max"},{"label":"Foreign matter","value":"0.5% max"},{"label":"Black & broken","value":"2% max"},{"label":"Other coffee beans","value":"0.5% max"},{"label":"Bean size","value":"90% above Screen 16 (6.3 mm)"},{"label":"Processing","value":"Natural (dry)"},{"label":"Grade","value":"G1 · Screen 16 Clean"}]'::jsonb,
  moq = '1 × 20ft container (19.2 MT)',
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Посторонние примеси","value":"не более 0,5%"},{"label":"Чёрные и битые зёрна","value":"не более 2%"},{"label":"Зёрна других видов кофе","value":"не более 0,5%"},{"label":"Размер зерна","value":"90% выше скрина 16 (6,3 мм)"},{"label":"Обработка","value":"Натуральная (сухая)"},{"label":"Сорт","value":"G1 · скрин 16, очищенная"}],"moq":"1 × 20ft контейнер (19,2 т)"}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"المواد الغريبة","value":"0.5% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"2% كحد أقصى"},{"label":"حبوب قهوة من أنواع أخرى","value":"0.5% كحد أقصى"},{"label":"حجم الحبة","value":"90% فوق غربال 16 (6.3 مم)"},{"label":"المعالجة","value":"طبيعية (جافة)"},{"label":"الدرجة","value":"G1 · غربال 16 نظيفة"}],"moq":"حاوية 20 قدم واحدة (19.2 طن)"}'::jsonb
  ),
  updated_at = now()
where slug = 'robusta-s16-clean';

update public.products set
  specs = '[{"label":"Moisture","value":"13% max"},{"label":"Foreign matter","value":"1% max"},{"label":"Black & broken","value":"5% max"},{"label":"Other coffee beans","value":"1% max"},{"label":"Bean size","value":"90% above Screen 13 (5.0 mm)"},{"label":"Processing","value":"Natural (dry)"},{"label":"Grade","value":"G2"}]'::jsonb,
  moq = '1 × 20ft container (19.2 MT bagged, 21.6 MT in bulk)',
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"specs":[{"label":"Влажность","value":"не более 13%"},{"label":"Посторонние примеси","value":"не более 1%"},{"label":"Чёрные и битые зёрна","value":"не более 5%"},{"label":"Зёрна других видов кофе","value":"не более 1%"},{"label":"Размер зерна","value":"90% выше скрина 13 (5,0 мм)"},{"label":"Обработка","value":"Натуральная (сухая)"},{"label":"Сорт","value":"G2"}],"moq":"1 × 20ft контейнер (19,2 т в мешках, 21,6 т навалом)"}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"specs":[{"label":"الرطوبة","value":"13% كحد أقصى"},{"label":"المواد الغريبة","value":"1% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"5% كحد أقصى"},{"label":"حبوب قهوة من أنواع أخرى","value":"1% كحد أقصى"},{"label":"حجم الحبة","value":"90% فوق غربال 13 (5.0 مم)"},{"label":"المعالجة","value":"طبيعية (جافة)"},{"label":"الدرجة","value":"G2"}],"moq":"حاوية 20 قدم واحدة (19.2 طن في أكياس، 21.6 طن سائبة)"}'::jsonb
  ),
  updated_at = now()
where slug = 'robusta-g2-s13-14';

-- Placed after the last coffee grade; published, flagged as sample until the copy and photos are reviewed.
insert into public.products
  (slug, name, category, grade, summary, description, image, gallery, origin, specs, packaging, moq, featured, sort_order, translations, is_sample)
select
  'robusta-fully-washed-special-g1',
  'Robusta Fully Washed Special G1',
  'coffee',
  'Special G1 · Screen 16 / 18 · Fully washed',
  'Fully washed Special Grade 1 Robusta in Screen 16 or 18 — zero black beans and our tightest defect limits.',
  'Ripe cherries are pulped, fermented and fully washed before drying, then hulled and sorted to Screen 16 or Screen 18. Washing strips the mucilage that gives natural Robusta its earthy edge, leaving a cleaner, sweeter cup — a Robusta that can stand on its own in specialty espresso and single-origin programs.',
  'https://images.unsplash.com/photo-1561766858-62033ae40ec3',
  array['https://images.unsplash.com/photo-1750967613671-297f1b63038d', 'https://images.unsplash.com/photo-1524350876685-274059332603']::text[],
  'Central Highlands, Vietnam',
  '[{"label":"Moisture","value":"12.5% max"},{"label":"Black beans","value":"0%"},{"label":"Broken beans","value":"0.2% max"},{"label":"Foreign matter","value":"0.1% max"},{"label":"Sticks & stones","value":"0.02% max"},{"label":"Bean size","value":"90% above Screen 18 (7.1 mm) or Screen 16 (6.3 mm)"},{"label":"Processing","value":"Fully washed"},{"label":"Grade","value":"Special G1"}]'::jsonb,
  '60 kg jute bags batched with vegetable oil',
  '1 × 20ft container (18 MT)',
  false,
  coalesce((select max(sort_order) from public.products where category = 'coffee'), 0) + 5,
  '{"ru":{"name":"Робуста полностью мытая, Special G1","grade":"Special G1 · скрин 16 / 18 · полностью мытая","summary":"Полностью мытая робуста Special Grade 1 скрин 16 или 18 — без чёрных зёрен и с самыми строгими допусками по дефектам.","description":"Спелые ягоды депульпируют, ферментируют и полностью промывают перед сушкой, затем очищают и калибруют по скрину 16 или 18. Промывка удаляет слизистый слой, который придаёт натуральной робусте землистые ноты, — чашка получается чище и слаще. Робуста, способная звучать самостоятельно в спешелти-эспрессо и моносортовых программах.","origin":"Центральное нагорье, Вьетнам","specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Чёрные зёрна","value":"0%"},{"label":"Битые зёрна","value":"не более 0,2%"},{"label":"Посторонние примеси","value":"не более 0,1%"},{"label":"Палочки и камни","value":"не более 0,02%"},{"label":"Размер зерна","value":"90% выше скрина 18 (7,1 мм) или скрина 16 (6,3 мм)"},{"label":"Обработка","value":"Полностью мытая"},{"label":"Сорт","value":"Special G1"}],"packaging":"Джутовые мешки по 60 кг, обработанные растительным маслом","moq":"1 × 20ft контейнер (18 т)"},"ar":{"name":"روبوستا مغسولة بالكامل Special G1","grade":"Special G1 · غربال 16 / 18 · مغسولة بالكامل","summary":"روبوستا مغسولة بالكامل من الدرجة الخاصة الأولى بغربال 16 أو 18 — دون حبوب سوداء وبأدق حدود العيوب لدينا.","description":"تُزال لبّ الثمار الناضجة وتُخمَّر وتُغسل بالكامل قبل التجفيف، ثم تُقشَّر وتُفرَز على غربال 16 أو 18. يزيل الغسل الطبقة اللزجة التي تمنح الروبوستا الطبيعية طابعها الترابي، فيأتي الفنجان أنظف وأحلى — روبوستا تقف بذاتها في برامج الإسبريسو المختصة وأحادية المصدر.","origin":"المرتفعات الوسطى، فيتنام","specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"الحبوب السوداء","value":"0%"},{"label":"الحبوب المكسورة","value":"0.2% كحد أقصى"},{"label":"المواد الغريبة","value":"0.1% كحد أقصى"},{"label":"العيدان والحجارة","value":"0.02% كحد أقصى"},{"label":"حجم الحبة","value":"90% فوق غربال 18 (7.1 مم) أو غربال 16 (6.3 مم)"},{"label":"المعالجة","value":"مغسولة بالكامل"},{"label":"الدرجة","value":"Special G1"}],"packaging":"أكياس جوت 60 كغ معالجة بالزيت النباتي","moq":"حاوية 20 قدم واحدة (18 طن)"}}'::jsonb,
  true
on conflict (slug) do nothing;
