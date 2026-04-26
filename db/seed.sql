-- Seed initial data. Safe to re-run (uses on conflict do nothing).

insert into categories (slug, name, description, icon, sort_order) values
  ('templates',    '{"en":"Templates","ar":"قوالب"}',                '{"en":"Ready-made templates","ar":"قوالب جاهزة"}',          'layout-template',  10),
  ('spreadsheets', '{"en":"Spreadsheets","ar":"شيتات"}',             '{"en":"Excel & Google Sheets","ar":"إكسل وجوجل شيتس"}',    'table',            20),
  ('prompts',      '{"en":"Prompt packs","ar":"حزم البرومبت"}',      '{"en":"Curated prompt packs","ar":"حزم برومبت منتقاة"}',   'sparkles',         30),
  ('ebooks',       '{"en":"E-books & guides","ar":"كتب وأدلة"}',     '{"en":"PDF guides","ar":"أدلة PDF"}',                       'book-open',        40),
  ('code',         '{"en":"Code & components","ar":"كود ومكونات"}',  '{"en":"Snippets & boilerplates","ar":"مقتطفات وقواعد كود"}','code',            50),
  ('notion',       '{"en":"Notion systems","ar":"أنظمة نوشن"}',      '{"en":"Productivity systems","ar":"أنظمة إنتاجية"}',        'sticky-note',      60),
  ('courses',      '{"en":"Mini-courses","ar":"كورسات مصغرة"}',      '{"en":"Self-paced learning","ar":"تعلّم ذاتي"}',            'graduation-cap',   70)
on conflict (slug) do nothing;
