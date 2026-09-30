-- Insights: buyer guides, market updates and company news (/insights on the website).
-- Same conventions as the other CMS tables (see 0003_cms.sql): English in the main columns,
-- Russian/Arabic in `translations`, `is_sample` for placeholder content, `published` for visibility.
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text not null default '',
  -- Light Markdown: "## " headings, "- " / "1. " lists, "> " quotes, **bold**, *italic*, [links](/path).
  body          text not null default '',
  cover         text,
  category      text not null default 'guide' check (category in ('guide', 'market', 'news')),
  published_at  date not null default current_date,
  -- Products the article is about; it is listed on those product pages.
  product_slugs text[] not null default '{}',
  translations  jsonb not null default '{}',
  is_sample     boolean not null default false,
  published     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_published_at_idx on public.posts (published_at desc);

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts" on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads published posts" on public.posts;
create policy "Public reads published posts" on public.posts
  for select to anon, authenticated using (published);

-- Three starter buyer guides (is_sample = true, listed on the admin dashboard for review).
-- Only inserted while the table is empty, so re-running this file is safe. Same rows as supabase/seed.sql.
insert into public.posts (slug, title, excerpt, category, published_at, cover, product_slugs, body, translations, is_sample, published, sort_order)
select * from (values
  ('cashew-kernel-grades-explained', 'Cashew kernel grades explained: from W180 to splits and pieces', 'What the letters and numbers on a cashew contract mean, how whole grades differ from splits and pieces, and how to choose the right grade for your product.', 'guide', '2026-09-16', 'https://images.unsplash.com/photo-1686721635283-70e6344183e1', array['cashew-ww240', 'cashew-ww320', 'cashew-ws', 'cashew-lwp']::text[], 'Cashew kernels are traded on a grading system that tells you three things at a glance: the colour of the kernel, whether it is whole or broken, and — for wholes — how many kernels make up one pound. Knowing how to read it makes quotes easier to compare and avoids surprises when the container arrives.

## The letters: colour and shape

- **W — white wholes:** uniform ivory or pale white kernels, the premium category.
- **SW — scorched wholes:** slightly darker from longer roasting during shelling; same taste, lower price.
- **LBW / DW — light blemished and dessert wholes:** kernels with small spots or deeper colour, well suited to roasting, coating and ingredients.

## The numbers: kernels per pound

For whole grades, the number is the maximum count of kernels per pound (454 g). A lower number means larger kernels:

- **W180** — the largest standard grade, often sold as a premium snack.
- **W240** — large kernels, popular for retail packs and roasted snacks.
- **W320** — the most widely traded grade worldwide, the usual choice for snacks and mixes.
- **W450** — smaller wholes at a lower price, common in ingredient use.

## Splits and pieces

Kernels that break during shelling are sorted by size: **WS** (white splits, halved lengthwise), **WB** (butts, broken crosswise), **LWP** and **SWP** (large and small white pieces) and **BB** (baby bits). For bakery, confectionery, sauces and cashew butter, pieces give the same flavour at a fraction of the price of wholes.

## What else to check on the specification

Grade is only part of the picture. Ask for moisture (typically 5% max), the tolerance for lower grades within the lot, and the packing — usually vacuum-packed in 22.68 kg (50 lb) bags or tins, two per carton, flushed with CO₂ or nitrogen for shelf life.

> Not sure which grade fits your product? Tell us how you will use the kernels and we will suggest two or three options with samples.

[Request a quote or samples](/contact)', '{"ru":{"title":"Сорта ядра кешью: от W180 до половинок и кусочков","excerpt":"Что означают буквы и цифры в контракте на кешью, чем целые сорта отличаются от половинок и кусочков и как выбрать сорт под ваш продукт.","body":"Ядро кешью торгуется по системе сортов, которая сразу показывает три вещи: цвет ядра, целое оно или колотое и — для целых — сколько ядер приходится на один фунт. Умение её читать упрощает сравнение предложений и избавляет от сюрпризов при получении контейнера.\n\n## Буквы: цвет и форма\n\n- **W — белые целые:** равномерный цвет слоновой кости или светлый, премиальная категория.\n- **SW — подпалённые целые:** чуть темнее из-за более долгой обжарки при очистке; вкус тот же, цена ниже.\n- **LBW / DW — целые с лёгкими пятнами и десертные:** ядра с небольшими пятнами или более тёмным цветом, хорошо подходят для обжарки, глазури и ингредиентов.\n\n## Цифры: количество ядер на фунт\n\nДля целых сортов число означает максимальное количество ядер на фунт (454 г). Чем меньше число, тем крупнее ядро:\n\n- **W180** — самый крупный стандартный сорт, часто продаётся как премиальный снек.\n- **W240** — крупное ядро, популярно для розничной фасовки и жареных снеков.\n- **W320** — самый распространённый сорт в мировой торговле, обычный выбор для снеков и смесей.\n- **W450** — более мелкие целые ядра по более низкой цене, часто используются как ингредиент.\n\n## Половинки и кусочки\n\nЯдра, расколовшиеся при очистке, сортируют по размеру: **WS** (белые половинки, расколотые вдоль), **WB** (ядра, сломанные поперёк), **LWP** и **SWP** (крупные и мелкие белые кусочки) и **BB** (мелкая крошка). Для выпечки, кондитерских изделий, соусов и пасты из кешью кусочки дают тот же вкус за часть цены целых ядер.\n\n## Что ещё проверить в спецификации\n\nСорт — лишь часть картины. Уточните влажность (обычно не более 5%), допуск более низких сортов в партии и упаковку — как правило, вакуумные пакеты или жестяные банки по 22,68 кг (50 фунтов), по две в коробке, с продувкой CO₂ или азотом для сохранности.\n\n> Не уверены, какой сорт подойдёт? Расскажите, как вы будете использовать ядро, и мы предложим два-три варианта с образцами.\n\n[Запросить цену или образцы](/contact)"},"ar":{"title":"درجات حبوب الكاجو: من W180 إلى الأنصاف والقطع","excerpt":"ماذا تعني الحروف والأرقام في عقد الكاجو، وكيف تختلف الحبوب الكاملة عن الأنصاف والقطع، وكيف تختار الدرجة المناسبة لمنتجك.","body":"يُتداول الكاجو وفق نظام درجات يوضح ثلاثة أمور بنظرة واحدة: لون الحبة، وهل هي كاملة أم مكسورة، وعدد الحبوب في الرطل الواحد بالنسبة للحبوب الكاملة. فهم هذا النظام يسهّل مقارنة عروض الأسعار ويجنّبكم المفاجآت عند وصول الحاوية.\n\n## الحروف: اللون والشكل\n\n- **W — كاملة بيضاء:** حبوب بلون عاجي أو أبيض فاتح متجانس، وهي الفئة الممتازة.\n- **SW — كاملة محمّصة قليلًا:** أغمق قليلًا بسبب تحميص أطول أثناء التقشير؛ الطعم نفسه بسعر أقل.\n- **LBW / DW — كاملة ببقع خفيفة وكاملة للحلويات:** حبوب بها بقع صغيرة أو لون أغمق، مناسبة للتحميص والتغليف والاستخدام كمكوّن.\n\n## الأرقام: عدد الحبوب في الرطل\n\nفي الدرجات الكاملة يشير الرقم إلى الحد الأقصى لعدد الحبوب في الرطل (454 غرامًا). كلما قلّ الرقم كبر حجم الحبة:\n\n- **W180** — أكبر درجة قياسية، وغالبًا ما تُباع كوجبة خفيفة فاخرة.\n- **W240** — حبوب كبيرة، شائعة في عبوات التجزئة والوجبات المحمّصة.\n- **W320** — الدرجة الأكثر تداولًا عالميًا، والخيار المعتاد للوجبات الخفيفة والخلطات.\n- **W450** — حبوب كاملة أصغر بسعر أقل، شائعة في الاستخدام كمكوّن.\n\n## الأنصاف والقطع\n\nتُفرز الحبوب التي تنكسر أثناء التقشير حسب الحجم: **WS** (أنصاف بيضاء مشقوقة طوليًا)، و**WB** (مكسورة عرضيًا)، و**LWP** و**SWP** (قطع بيضاء كبيرة وصغيرة)، و**BB** (فتات صغير). وفي المخبوزات والحلويات والصلصات وزبدة الكاجو تمنح القطع النكهة نفسها بجزء من سعر الحبوب الكاملة.\n\n## ما الذي يجب التحقق منه أيضًا في المواصفات\n\nالدرجة جزء من الصورة فقط. اسألوا عن نسبة الرطوبة (عادةً 5% كحد أقصى)، ونسبة السماح بالدرجات الأدنى في الدفعة، وطريقة التعبئة — عادةً أكياس مفرّغة من الهواء أو علب صفيح سعة 22.68 كغ (50 رطلًا)، اثنتان في كل كرتونة، مع ضخ ثاني أكسيد الكربون أو النيتروجين لإطالة مدة الصلاحية.\n\n> لستم متأكدين من الدرجة المناسبة؟ أخبرونا كيف ستستخدمون الكاجو وسنقترح عليكم خيارين أو ثلاثة مع عيّنات.\n\n[اطلبوا عرض سعر أو عيّنات](/contact)"}}'::jsonb, true, true, 10),
  ('robusta-screen-sizes-s13-to-s18', 'Robusta screen sizes S13 to S18: what the numbers mean for your blend', 'How green coffee is graded by bean size and defects in Vietnam, and when it pays to buy S18 rather than S16 or S13.', 'guide', '2026-09-09', 'https://images.unsplash.com/photo-1561986845-fbeb7f7913d8', array['robusta-s18-clean', 'robusta-s16-clean', 'robusta-s13-14', 'robusta-s18-wet-polished']::text[], 'Vietnam is the world''s largest producer of Robusta, and most of it is sold by screen size and grade. The labels look technical, but they come down to two questions: how big are the beans, and how clean is the lot?

## What a screen size is

Green beans are shaken over perforated sieves called screens. The screen number is the hole diameter in 64ths of an inch, so **screen 18** has holes of 18/64" (about 7.1 mm) and **screen 13** about 5.2 mm. "S18" means that most of the lot — typically 90% — stays on top of screen 18.

## The common Vietnamese Robusta grades

- **S18 (Grade 1):** the largest beans. Even size gives an even roast, which matters for roasted whole-bean retail and espresso blends.
- **S16 (Grade 1):** slightly smaller, still very uniform — a popular balance of quality and price for blends.
- **S13/S14 (Grade 2):** smaller beans with a higher defect allowance, widely used for instant coffee and price-driven blends.

## Grade is about defects, not only size

Alongside the screen, the specification sets limits for moisture (usually 12.5% max), foreign matter and black and broken beans. A "clean" lot has foreign matter around 0.1% max; Grade 1 typically allows about 2% black and broken, Grade 2 about 5%.

## Wet polished or natural?

Most Vietnamese Robusta is dry-processed (natural). **Wet polished** beans go through an extra polishing step that removes the silverskin, giving a cleaner look and a slightly cleaner cup — worth it when appearance matters to your customers.

## How to choose

Match the grade to the product: S18 for premium whole-bean and espresso, S16 for most roast-and-ground blends, S13/S14 for instant and value lines. The best check is always a pre-shipment sample roasted on your own profile.

[Browse our coffee grades](/products?category=coffee)', '{"ru":{"title":"Размеры сита робусты от S13 до S18: что означают цифры для вашего бленда","excerpt":"Как во Вьетнаме сортируют зелёный кофе по размеру зерна и дефектам и когда выгоднее покупать S18, а не S16 или S13.","body":"Вьетнам — крупнейший в мире производитель робусты, и большая её часть продаётся по размеру сита и сорту. Обозначения выглядят технично, но сводятся к двум вопросам: насколько крупное зерно и насколько чистая партия?\n\n## Что такое размер сита\n\nЗелёное зерно просеивают через перфорированные сита. Номер сита — это диаметр отверстия в 1/64 дюйма, поэтому у **сита 18** отверстия 18/64\" (около 7,1 мм), а у **сита 13** — около 5,2 мм. «S18» означает, что большая часть партии — обычно 90% — остаётся на сите 18.\n\n## Основные сорта вьетнамской робусты\n\n- **S18 (Grade 1):** самое крупное зерно. Одинаковый размер даёт равномерную обжарку, что важно для розничного зернового кофе и эспрессо-блендов.\n- **S16 (Grade 1):** чуть мельче, но по-прежнему очень однородное — популярный баланс качества и цены для блендов.\n- **S13/S14 (Grade 2):** более мелкое зерно с большим допуском дефектов, широко используется для растворимого кофе и бюджетных блендов.\n\n## Сорт — это не только размер, но и дефекты\n\nПомимо сита, спецификация задаёт пределы по влажности (обычно не более 12,5%), посторонним примесям, чёрным и битым зёрнам. В «чистой» партии посторонних примесей около 0,1% максимум; Grade 1 обычно допускает около 2% чёрных и битых зёрен, Grade 2 — около 5%.\n\n## Влажная полировка или натуральная обработка?\n\nБольшая часть вьетнамской робусты обрабатывается сухим (натуральным) способом. Зерно **wet polished** проходит дополнительную полировку, снимающую серебристую плёнку: оно выглядит чище и даёт чуть более чистую чашку — это оправдано, когда внешний вид важен вашим покупателям.\n\n## Как выбрать\n\nПодбирайте сорт под продукт: S18 — для премиального зернового кофе и эспрессо, S16 — для большинства молотых блендов, S13/S14 — для растворимого кофе и эконом-линеек. Лучшая проверка — предотгрузочный образец, обжаренный по вашему профилю.\n\n[Посмотреть наши сорта кофе](/products?category=coffee)"},"ar":{"title":"أحجام غربال روبوستا من S13 إلى S18: ماذا تعني الأرقام لخلطتكم","excerpt":"كيف تُصنَّف القهوة الخضراء في فيتنام حسب حجم الحبة والعيوب، ومتى يكون شراء S18 أجدى من S16 أو S13.","body":"فيتنام أكبر منتج لقهوة روبوستا في العالم، ويُباع معظمها حسب حجم الغربال والدرجة. تبدو هذه التسميات تقنية، لكنها تختصر سؤالين: ما حجم الحبوب، وما مدى نظافة الدفعة؟\n\n## ما هو حجم الغربال\n\nتُهزّ الحبوب الخضراء فوق مناخل مثقّبة تُسمّى الغرابيل. ويمثّل رقم الغربال قطر الثقب بوحدة 1/64 من البوصة، لذا فإن ثقوب **الغربال 18** تبلغ 18/64 بوصة (نحو 7.1 مم)، و**الغربال 13** نحو 5.2 مم. وتعني «S18» أن معظم الدفعة — عادةً 90% — يبقى فوق الغربال 18.\n\n## درجات روبوستا الفيتنامية الشائعة\n\n- **S18 (الدرجة الأولى):** أكبر الحبوب. تجانس الحجم يمنح تحميصًا متجانسًا، وهو أمر مهم لحبوب التجزئة المحمّصة وخلطات الإسبريسو.\n- **S16 (الدرجة الأولى):** أصغر قليلًا ولا تزال متجانسة جدًا — توازن شائع بين الجودة والسعر للخلطات.\n- **S13/S14 (الدرجة الثانية):** حبوب أصغر مع نسبة سماح أعلى للعيوب، تُستخدم على نطاق واسع للقهوة سريعة الذوبان والخلطات الاقتصادية.\n\n## الدرجة تتعلق بالعيوب لا بالحجم فقط\n\nإلى جانب الغربال، تحدد المواصفات حدودًا للرطوبة (عادةً 12.5% كحد أقصى)، والمواد الغريبة، والحبوب السوداء والمكسورة. في الدفعة «النظيفة» تكون المواد الغريبة نحو 0.1% كحد أقصى؛ وتسمح الدرجة الأولى عادةً بنحو 2% من الحبوب السوداء والمكسورة، والدرجة الثانية بنحو 5%.\n\n## مصقولة رطبًا أم طبيعية؟\n\nتُعالَج معظم روبوستا الفيتنامية بالطريقة الجافة (الطبيعية). أما الحبوب **المصقولة رطبًا** فتمر بمرحلة صقل إضافية تزيل القشرة الفضية، فتبدو أنظف وتمنح فنجانًا أنقى قليلًا — وهذا مجدٍ عندما يهم المظهر عملاءكم.\n\n## كيف تختارون\n\nاختاروا الدرجة حسب المنتج: S18 للحبوب الكاملة الفاخرة والإسبريسو، وS16 لمعظم خلطات القهوة المطحونة، وS13/S14 للقهوة سريعة الذوبان والخطوط الاقتصادية. وأفضل اختبار دائمًا هو عيّنة ما قبل الشحن تُحمَّص وفق ملفكم الخاص.\n\n[تصفحوا درجات القهوة لدينا](/products?category=coffee)"}}'::jsonb, true, true, 20),
  ('fob-cfr-or-cif-importing-from-vietnam', 'FOB, CFR or CIF? Choosing Incoterms when importing from Vietnam', 'Who pays for freight and insurance, where the risk passes to you, and which term makes sense for your first container of coffee or cashews.', 'guide', '2026-09-02', 'https://images.unsplash.com/photo-1578575437130-527eed3abbec', array[]::text[], 'The Incoterm on your contract decides who books the ship, who pays for freight and insurance, and — most importantly — at which point the goods become your risk. For coffee and cashews shipped from Vietnam, three terms cover almost every deal.

## FOB — Free On Board

We deliver the goods cleared for export and loaded on the vessel at the port of loading, usually Ho Chi Minh City or Hai Phong. From that moment the risk is yours, and you book and pay for the ocean freight and insurance.

**Choose FOB when** you already work with a freight forwarder or have good freight rates of your own.

## CFR — Cost and Freight

We also book and pay for the sea freight to your destination port. The risk still passes to you once the goods are on board in Vietnam, so you arrange cargo insurance yourself.

**Choose CFR when** you want one delivered price to compare offers, but prefer to control your own insurance.

## CIF — Cost, Insurance and Freight

Like CFR, plus we buy cargo insurance for the voyage. Under Incoterms 2020, CIF only requires minimum cover (Institute Cargo Clauses C) unless the contract says otherwise — ask for broader cover if you need it.

**Choose CIF when** this is your first import from Vietnam or you want the simplest paperwork on your side.

## Other points to agree in the contract

- The exact named port, for example "FOB Ho Chi Minh City" or "CIF Jebel Ali".
- Payment terms — T/T, L/C at sight or CAD — and when each payment is due.
- The documents you need for customs: commercial invoice, packing list, bill of lading, certificate of origin, phytosanitary certificate and any quality or fumigation certificates.

> We quote FOB, CFR and CIF on request. Tell us your destination port and we will send a side-by-side comparison.

[Ask for a quote](/contact)', '{"ru":{"title":"FOB, CFR или CIF? Выбор Инкотермс при импорте из Вьетнама","excerpt":"Кто оплачивает фрахт и страховку, в какой момент риск переходит к вам и какое условие выбрать для первого контейнера кофе или кешью.","body":"Условие Инкотермс в контракте определяет, кто бронирует судно, кто платит за фрахт и страховку и — самое важное — в какой момент товар переходит на ваш риск. Для кофе и кешью из Вьетнама почти все сделки заключаются на одном из трёх условий.\n\n## FOB — Free On Board (франко борт)\n\nМы передаём товар, прошедший экспортное оформление и погруженный на судно в порту отгрузки — обычно Хошимин или Хайфон. С этого момента риск переходит к вам, а морской фрахт и страховку вы бронируете и оплачиваете сами.\n\n**Выбирайте FOB, если** вы уже работаете с экспедитором или у вас выгодные собственные ставки фрахта.\n\n## CFR — Cost and Freight (стоимость и фрахт)\n\nМы также бронируем и оплачиваем морскую перевозку до вашего порта назначения. Риск всё равно переходит к вам после погрузки товара на борт во Вьетнаме, поэтому страхование груза вы организуете сами.\n\n**Выбирайте CFR, если** хотите сравнивать предложения по единой цене с доставкой, но предпочитаете сами контролировать страховку.\n\n## CIF — Cost, Insurance and Freight (стоимость, страхование и фрахт)\n\nТо же, что CFR, плюс мы страхуем груз на время перевозки. По Инкотермс 2020 условие CIF требует лишь минимального покрытия (Институтские грузовые оговорки C), если в контракте не указано иное, — при необходимости запросите более широкое покрытие.\n\n**Выбирайте CIF, если** это ваш первый импорт из Вьетнама или вы хотите минимум документов на своей стороне.\n\n## Что ещё согласовать в контракте\n\n- Точный порт, например «FOB Хошимин» или «CIF Новороссийск».\n- Условия оплаты — T/T, аккредитив по предъявлении или CAD — и сроки каждого платежа.\n- Документы для таможни: коммерческий инвойс, упаковочный лист, коносамент, сертификат происхождения, фитосанитарный сертификат и, при необходимости, сертификаты качества или фумигации.\n\n> Мы предоставляем цены на условиях FOB, CFR и CIF по запросу. Укажите ваш порт назначения, и мы пришлём сравнение.\n\n[Запросить цену](/contact)"},"ar":{"title":"FOB أم CFR أم CIF؟ اختيار شروط إنكوترمز عند الاستيراد من فيتنام","excerpt":"من يدفع الشحن والتأمين، ومتى تنتقل المخاطر إليكم، وأي شرط يناسب حاويتكم الأولى من القهوة أو الكاجو.","body":"يحدد شرط إنكوترمز في عقدكم من يحجز السفينة، ومن يدفع الشحن والتأمين، والأهم من ذلك متى تصبح البضاعة على مسؤوليتكم. وبالنسبة للقهوة والكاجو المشحونة من فيتنام، تغطي ثلاثة شروط جميع الصفقات تقريبًا.\n\n## FOB — التسليم على ظهر السفينة\n\nنسلّم البضاعة مُخلّصة للتصدير ومُحمّلة على السفينة في ميناء الشحن، عادةً مدينة هو تشي منه أو هاي فونغ. ومن تلك اللحظة تنتقل المخاطر إليكم، وتحجزون الشحن البحري والتأمين وتدفعون تكلفتهما.\n\n**اختاروا FOB إذا** كنتم تتعاملون بالفعل مع وكيل شحن أو لديكم أسعار شحن جيدة خاصة بكم.\n\n## CFR — التكلفة والشحن\n\nنحجز الشحن البحري أيضًا وندفعه حتى ميناء الوصول لديكم. لكن المخاطر تنتقل إليكم بمجرد تحميل البضاعة على السفينة في فيتنام، لذا تتولون تأمين البضاعة بأنفسكم.\n\n**اختاروا CFR إذا** أردتم سعرًا موحدًا شاملًا للشحن لمقارنة العروض، مع الاحتفاظ بالتحكم في التأمين.\n\n## CIF — التكلفة والتأمين والشحن\n\nمثل CFR، مع قيامنا بشراء تأمين على البضاعة طوال الرحلة. ووفق إنكوترمز 2020 لا يتطلب شرط CIF سوى الحد الأدنى من التغطية (شروط معهد الشحن C) ما لم ينص العقد على غير ذلك — اطلبوا تغطية أوسع إذا احتجتم إليها.\n\n**اختاروا CIF إذا** كانت هذه أول عملية استيراد لكم من فيتنام أو أردتم أبسط الإجراءات من جانبكم.\n\n## نقاط أخرى يجب الاتفاق عليها في العقد\n\n- الميناء المحدد بدقة، مثل «FOB هو تشي منه» أو «CIF جبل علي».\n- شروط الدفع — تحويل مصرفي أو اعتماد مستندي عند الاطلاع أو الدفع مقابل المستندات — وموعد كل دفعة.\n- المستندات التي تحتاجونها للجمارك: الفاتورة التجارية، وقائمة التعبئة، وبوليصة الشحن، وشهادة المنشأ، والشهادة الصحية النباتية، وأي شهادات جودة أو تبخير.\n\n> نقدّم أسعارًا بشروط FOB وCFR وCIF عند الطلب. أخبرونا بميناء الوصول وسنرسل لكم مقارنة جنبًا إلى جنب.\n\n[اطلبوا عرض سعر](/contact)"}}'::jsonb, true, true, 30)
) as v(slug, title, excerpt, category, published_at, cover, product_slugs, body, translations, is_sample, published, sort_order)
where not exists (select 1 from public.posts);
