-- Coffee grade pages (Oct 2026): sample-tray photos with their spec cards as each grade's main image,
-- and specs matched to those cards — Robusta S18/S16/S13: moisture 12.5%, foreign matter 0.1%,
-- black & broken 0.1–0.5%; Arabica S13/S14 is G1 with black & broken 0.5%.
-- Robusta S13/S14 (slug robusta-g2-s13-14) and Arabica S13/S14 get their name/grade/copy updated to match.
-- Only these fields (and the same keys inside translations.ru / .ar) are replaced; other CMS edits are kept.
-- Safe to run more than once.

update public.products set
  image = '/photos/grade-robusta-s18.jpg',
  gallery = array['/photos/green-beans-palm.jpg', '/photos/factory-sacks-silos.jpg']::text[],
  specs = '[{"label":"Moisture","value":"12.5% max"},{"label":"Foreign matter","value":"0.1% max"},{"label":"Black & broken","value":"0.1–0.5%"},{"label":"Bean size","value":"90% above Screen 18 (7.1 mm)"},{"label":"Processing","value":"Natural (dry), polished"},{"label":"Grade","value":"G1 · Screen 18 Clean"}]'::jsonb,
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Посторонние примеси","value":"не более 0,1%"},{"label":"Чёрные и битые зёрна","value":"0,1–0,5%"},{"label":"Размер зерна","value":"90% выше скрина 18 (7,1 мм)"},{"label":"Обработка","value":"Натуральная (сухая), с полировкой"},{"label":"Сорт","value":"G1 · скрин 18, очищенная"}]}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"المواد الغريبة","value":"0.1% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"0.1–0.5%"},{"label":"حجم الحبة","value":"90% فوق غربال 18 (7.1 مم)"},{"label":"المعالجة","value":"طبيعية (جافة) مع التلميع"},{"label":"الدرجة","value":"G1 · غربال 18 نظيفة"}]}'::jsonb
  ),
  updated_at = now()
where slug = 'robusta-s18-clean';

update public.products set
  image = '/photos/grade-robusta-s16.jpg',
  gallery = array['/photos/green-beans-basket.jpg', '/photos/pallet-stack.jpg']::text[],
  specs = '[{"label":"Moisture","value":"12.5% max"},{"label":"Foreign matter","value":"0.1% max"},{"label":"Black & broken","value":"0.1–0.5%"},{"label":"Bean size","value":"90% above Screen 16 (6.3 mm)"},{"label":"Processing","value":"Natural (dry)"},{"label":"Grade","value":"G1 · Screen 16 Clean"}]'::jsonb,
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Посторонние примеси","value":"не более 0,1%"},{"label":"Чёрные и битые зёрна","value":"0,1–0,5%"},{"label":"Размер зерна","value":"90% выше скрина 16 (6,3 мм)"},{"label":"Обработка","value":"Натуральная (сухая)"},{"label":"Сорт","value":"G1 · скрин 16, очищенная"}]}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"المواد الغريبة","value":"0.1% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"0.1–0.5%"},{"label":"حجم الحبة","value":"90% فوق غربال 16 (6.3 مم)"},{"label":"المعالجة","value":"طبيعية (جافة)"},{"label":"الدرجة","value":"G1 · غربال 16 نظيفة"}]}'::jsonb
  ),
  updated_at = now()
where slug = 'robusta-s16-clean';

update public.products set
  name = 'Robusta S13/S14',
  grade = 'Screen 13–14 · Clean',
  summary = 'Clean Robusta in Screen 13–14 for blends and soluble coffee at scale.',
  description = 'Natural-processed Robusta from Dak Lak and Gia Lai, cleaned to the same tolerances as our larger grades — 0.1% foreign matter, 0.1–0.5% black and broken — and sorted to Screen 13–14. Suited to volume roasting, blends and soluble programs where price and steady supply lead.',
  image = '/photos/grade-robusta-s13.jpg',
  gallery = array['/photos/green-beans-hand.jpg', '/photos/warehouse-stacking.jpg']::text[],
  specs = '[{"label":"Moisture","value":"12.5% max"},{"label":"Foreign matter","value":"0.1% max"},{"label":"Black & broken","value":"0.1–0.5%"},{"label":"Bean size","value":"90% above Screen 13 (5.0 mm)"},{"label":"Processing","value":"Natural (dry)"},{"label":"Grade","value":"S13/S14 Clean"}]'::jsonb,
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"name":"Робуста S13/S14","grade":"скрин 13–14 · очищенная","summary":"Очищенная робуста скрин 13–14 для бленд и растворимого кофе в больших объёмах.","description":"Робуста натуральной обработки из Даклака и Зялая, очищенная до тех же допусков, что и наши крупные сорта, — 0,1% посторонних примесей, 0,1–0,5% чёрных и битых зёрен — и откалиброванная по скрину 13–14. Подходит для объёмной обжарки, бленд и растворимого кофе, где важны цена и стабильные поставки.","specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Посторонние примеси","value":"не более 0,1%"},{"label":"Чёрные и битые зёрна","value":"0,1–0,5%"},{"label":"Размер зерна","value":"90% выше скрина 13 (5,0 мм)"},{"label":"Обработка","value":"Натуральная (сухая)"},{"label":"Сорт","value":"S13/S14, очищенная"}]}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"name":"روبوستا S13/S14","grade":"غربال 13–14 · نظيفة","summary":"روبوستا نظيفة بغربال 13–14 للخلطات والقهوة سريعة التحضير بكميات كبيرة.","description":"روبوستا معالجة بالطريقة الطبيعية من داك لاك وجيا لاي، منظّفة وفق الحدود نفسها لدرجاتنا الأكبر — 0.1% مواد غريبة و0.1–0.5% حبوب سوداء ومكسورة — ومفروزة على غربال 13–14. مناسبة للتحميص بكميات كبيرة والخلطات والقهوة سريعة التحضير حيث السعر والإمداد المنتظم هما الأولوية.","specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"المواد الغريبة","value":"0.1% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"0.1–0.5%"},{"label":"حجم الحبة","value":"90% فوق غربال 13 (5.0 مم)"},{"label":"المعالجة","value":"طبيعية (جافة)"},{"label":"الدرجة","value":"S13/S14 نظيفة"}]}'::jsonb
  ),
  updated_at = now()
where slug = 'robusta-g2-s13-14';

update public.products set
  image = '/photos/grade-arabica-s18.jpg',
  gallery = array['/photos/green-beans-gloves.jpg', '/photos/drying-beds.jpg']::text[],
  specs = '[{"label":"Moisture","value":"12.5% max"},{"label":"Foreign matter","value":"0.1% max"},{"label":"Black & broken","value":"0.1% max"},{"label":"Bean size","value":"90% above Screen 18"},{"label":"Processing","value":"Fully washed"},{"label":"Grade","value":"G1 · Premium"}]'::jsonb,
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Посторонние примеси","value":"не более 0,1%"},{"label":"Чёрные и битые зёрна","value":"не более 0,1%"},{"label":"Размер зерна","value":"90% выше скрина 18"},{"label":"Обработка","value":"Полностью мытая"},{"label":"Сорт","value":"G1 · премиум"}]}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"المواد الغريبة","value":"0.1% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"0.1% كحد أقصى"},{"label":"حجم الحبة","value":"90% فوق غربال 18"},{"label":"المعالجة","value":"مغسولة بالكامل"},{"label":"الدرجة","value":"G1 · ممتازة"}]}'::jsonb
  ),
  updated_at = now()
where slug = 'arabica-s18-clean';

update public.products set
  image = '/photos/grade-arabica-s16.jpg',
  gallery = array['/photos/arabica-s16-washed.jpg', '/photos/greenhouse-drying.jpg']::text[],
  specs = '[{"label":"Moisture","value":"12.5% max"},{"label":"Foreign matter","value":"0.1% max"},{"label":"Black & broken","value":"0.1% max"},{"label":"Bean size","value":"90% above Screen 16"},{"label":"Processing","value":"Fully washed"},{"label":"Grade","value":"G1 · Standard clean"}]'::jsonb,
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Посторонние примеси","value":"не более 0,1%"},{"label":"Чёрные и битые зёрна","value":"не более 0,1%"},{"label":"Размер зерна","value":"90% выше скрина 16"},{"label":"Обработка","value":"Полностью мытая"},{"label":"Сорт","value":"G1 · стандарт, очищенная"}]}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"المواد الغريبة","value":"0.1% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"0.1% كحد أقصى"},{"label":"حجم الحبة","value":"90% فوق غربال 16"},{"label":"المعالجة","value":"مغسولة بالكامل"},{"label":"الدرجة","value":"G1 · قياسية نظيفة"}]}'::jsonb
  ),
  updated_at = now()
where slug = 'arabica-s16-clean';

update public.products set
  name = 'Arabica S13/S14',
  grade = 'G1 · Screen 13–14',
  summary = 'Value Arabica in Screen 13–14 from northwest Vietnam for blends and ready-to-drink coffee.',
  description = 'Washed and semi-washed Arabica from the mountains of the northwest, graded G1 and sorted to Screen 13–14. A cost-effective way to bring Arabica character to blends, cold brew and RTD products.',
  image = '/photos/grade-arabica-s13.jpg',
  gallery = array['/photos/green-beans-gloves.jpg', '/photos/cherry-sorting.jpg']::text[],
  specs = '[{"label":"Moisture","value":"12.5% max"},{"label":"Foreign matter","value":"0.1% max"},{"label":"Black & broken","value":"0.5% max"},{"label":"Bean size","value":"90% above Screen 13/14"},{"label":"Processing","value":"Washed / semi-washed"},{"label":"Grade","value":"G1"}]'::jsonb,
  translations = translations || jsonb_build_object(
    'ru', coalesce(translations->'ru', '{}'::jsonb) || '{"name":"Арабика S13/S14","grade":"G1 · скрин 13–14","summary":"Доступная арабика скрин 13–14 с северо-запада Вьетнама для бленд и готовых кофейных напитков.","description":"Мытая и полумытая арабика из гор северо-запада, сорт G1, откалиброванная по скрину 13–14. Экономичный способ добавить характер арабики в бленды, колд-брю и готовые напитки.","specs":[{"label":"Влажность","value":"не более 12,5%"},{"label":"Посторонние примеси","value":"не более 0,1%"},{"label":"Чёрные и битые зёрна","value":"не более 0,5%"},{"label":"Размер зерна","value":"90% выше скрина 13/14"},{"label":"Обработка","value":"Мытая / полумытая"},{"label":"Сорт","value":"G1"}]}'::jsonb,
    'ar', coalesce(translations->'ar', '{}'::jsonb) || '{"name":"أرابيكا S13/S14","grade":"G1 · غربال 13–14","summary":"أرابيكا اقتصادية بغربال 13–14 من شمال غرب فيتنام للخلطات والقهوة الجاهزة للشرب.","description":"أرابيكا مغسولة وشبه مغسولة من جبال الشمال الغربي، من الدرجة G1 ومفروزة على غربال 13–14. طريقة اقتصادية لإضافة طابع الأرابيكا إلى الخلطات والقهوة الباردة والمشروبات الجاهزة.","specs":[{"label":"الرطوبة","value":"12.5% كحد أقصى"},{"label":"المواد الغريبة","value":"0.1% كحد أقصى"},{"label":"الحبوب السوداء والمكسورة","value":"0.5% كحد أقصى"},{"label":"حجم الحبة","value":"90% فوق غربال 13/14"},{"label":"المعالجة","value":"مغسولة / شبه مغسولة"},{"label":"الدرجة","value":"G1"}]}'::jsonb
  ),
  updated_at = now()
where slug = 'arabica-s13-14';

