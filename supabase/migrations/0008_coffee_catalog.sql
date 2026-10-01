-- Coffee catalog (Oct 2026): Arabica S18/S16/S13, Robusta S18/S16/S13 and a roasted & ground blend.
-- • Hides grades outside that list (published = false — still in the CMS, can be switched back on).
--   robusta-s13-14 duplicated robusta-g2-s13-14 (which carries the Robusta standards from 0007).
-- • Moves Robusta G2 S13/S14 up next to the other Robusta grades.
-- • Adds the 70% Robusta / 30% Arabica roasted & ground blend, flagged as sample until its copy is reviewed.
-- Safe to run more than once.

update public.products set published = false, featured = false, updated_at = now()
where slug in ('robusta-s13-14', 'robusta-g3', 'robusta-s16-wet-polished', 'robusta-s18-wet-polished', 'robusta-fully-washed-special-g1');

update public.products set sort_order = 30, updated_at = now() where slug = 'robusta-g2-s13-14';

insert into public.products
  (slug, name, category, grade, summary, description, image, gallery, origin, specs, packaging, moq, featured, sort_order, translations, is_sample, published)
values (
  'roasted-ground-blend-70-30', 'Roasted & Ground Coffee 70/30', 'coffee', '70% Robusta · 30% Arabica',
  'A roasted and ground blend of 70% Vietnamese Robusta and 30% Arabica, packed in valve bags for retail, HoReCa and private label.',
  'A ready-to-sell blend: Robusta from the Central Highlands gives body and crema, Arabica from Lam Dong adds aroma. Roasted to the profile you agree with us, ground for espresso, filter or phin, and packed in one-way-valve bags — under your own label on request.',
  '/photos/roasted-beans-bags.jpg', array['/photos/roasting-packing-line.jpg']::text[], 'Robusta: Central Highlands · Arabica: Lam Dong',
  '[{"label":"Blend","value":"70% Robusta / 30% Arabica"},{"label":"Form","value":"Roasted & ground (whole bean on request)"},{"label":"Roast level","value":"Agreed per order"},{"label":"Grind","value":"Espresso, filter or phin — to order"}]'::jsonb,
  'Bags with one-way degassing valve; private label on request', 'On request', false, 70,
  '{"ru":{"name":"Молотый жареный кофе 70/30","grade":"70% робуста · 30% арабика","summary":"Жареный молотый бленд из 70% вьетнамской робусты и 30% арабики в пакетах с клапаном — для розницы, HoReCa и частной марки.","description":"Готовый к продаже бленд: робуста из Центрального нагорья даёт плотность и крему, арабика из Ламдонга — аромат. Обжариваем по согласованному с вами профилю, мелем для эспрессо, фильтра или фина и фасуем в пакеты с односторонним клапаном — по запросу под вашей маркой.","origin":"Робуста: Центральное нагорье · Арабика: Ламдонг","specs":[{"label":"Бленд","value":"70% робуста / 30% арабика"},{"label":"Форма","value":"Жареный молотый (зерно — по запросу)"},{"label":"Степень обжарки","value":"Согласуется в заказе"},{"label":"Помол","value":"Эспрессо, фильтр или фин — под заказ"}],"packaging":"Пакеты с односторонним клапаном дегазации; частная марка по запросу","moq":"По запросу"},"ar":{"name":"قهوة محمّصة ومطحونة 70/30","grade":"70% روبوستا · 30% أرابيكا","summary":"خلطة محمّصة ومطحونة من 70% روبوستا فيتنامية و30% أرابيكا، معبأة في أكياس بصمام لتجارة التجزئة والفنادق والمطاعم والعلامات الخاصة.","description":"خلطة جاهزة للبيع: تمنح روبوستا المرتفعات الوسطى القوام والكريما، وتضيف أرابيكا لام دونغ الرائحة. نحمّصها وفق الدرجة المتفق عليها معكم، ونطحنها للإسبريسو أو الفلتر أو الفين، ونعبّئها في أكياس بصمام أحادي الاتجاه — وتحت علامتكم الخاصة عند الطلب.","origin":"روبوستا: المرتفعات الوسطى · أرابيكا: لام دونغ","specs":[{"label":"الخلطة","value":"70% روبوستا / 30% أرابيكا"},{"label":"الشكل","value":"محمّصة ومطحونة (حبوب كاملة عند الطلب)"},{"label":"درجة التحميص","value":"يُتفق عليها في كل طلبية"},{"label":"الطحن","value":"إسبريسو أو فلتر أو فين — حسب الطلب"}],"packaging":"أكياس بصمام أحادي الاتجاه لتصريف الغازات؛ علامة خاصة عند الطلب","moq":"عند الطلب"}}'::jsonb,
  true, true
)
on conflict (slug) do nothing;
