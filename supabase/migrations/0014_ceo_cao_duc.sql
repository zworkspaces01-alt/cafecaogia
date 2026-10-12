-- The head of Cao Gia is Mr. Cao Đức (confirmed by Cao Gia, October 2026). Replaces the placeholder CEO
-- profile: real name, the title "CEO", a short bio built only from confirmed company facts, and no quote
-- (the page hides the quote block when it is empty). Add a photo and a personal quote in the admin.
-- Safe to run more than once.

update public.team_members
set
  name = 'Cao Đức',
  role = 'CEO',
  bio = array[
    'Mr. Cao Đức leads Cao Gia, which has exported Vietnamese green coffee and cashew kernels since 2018.',
    'Under his direction the company ships 10–30 containers a year from its warehouses in Dak Lak and northern Vietnam to buyers in the United States, the European Union, Russia, the Middle East, Japan, South Korea and Australia.'
  ]::text[],
  quote = '',
  translations = jsonb_build_object(
    'ru', jsonb_build_object(
      'role', 'Генеральный директор',
      'bio', jsonb_build_array(
        'Г-н Као Дык руководит компанией Cao Gia, которая с 2018 года экспортирует вьетнамский зелёный кофе и ядра кешью.',
        'Под его руководством компания отгружает 10–30 контейнеров в год со своих складов в Даклаке и на севере Вьетнама покупателям в США, Европейском союзе, России, на Ближнем Востоке, в Японии, Южной Корее и Австралии.'
      ),
      'quote', ''
    ),
    'ar', jsonb_build_object(
      'role', 'الرئيس التنفيذي',
      'bio', jsonb_build_array(
        'يقود السيد كاو دوك شركة كاو جيا التي تصدّر البن الأخضر وحبات الكاجو الفيتنامية منذ عام 2018.',
        'وتحت إدارته تشحن الشركة من 10 إلى 30 حاوية سنويًا من مستودعاتها في داك لاك وشمال فيتنام إلى مشترين في الولايات المتحدة والاتحاد الأوروبي وروسيا والشرق الأوسط واليابان وكوريا الجنوبية وأستراليا.'
      ),
      'quote', ''
    )
  ),
  is_sample = false,
  published = true
where is_ceo;
