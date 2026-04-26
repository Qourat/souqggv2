-- ============================================================================
-- SOUQ.GG — canonical schema
-- Locale-agnostic: every user-facing string column is JSONB { locale: string }
-- so adding a new language is zero-DDL: just write the new locale key.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ----- enums ----------------------------------------------------------------
do $$ begin
  create type user_role as enum ('buyer','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_type as enum (
    'pdf','excel','word','notion','prompt_pack','template',
    'course','code','dataset','bundle','mixed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum ('draft','review','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type license_type as enum (
    'personal_use','business_use','commercial_use','resale_rights'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'pending','paid','fulfilled','refunded','failed','cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum (
    'stripe','paytabs','telr','checkout','manual'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_discount_type as enum ('percent','amount');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_status as enum ('pending','approved','hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ai_job_status as enum ('queued','running','succeeded','failed');
exception when duplicate_object then null; end $$;

-- ----- helpers --------------------------------------------------------------
-- Read the value for a given locale from a JSONB localized field. Falls back
-- to English, then to the first non-empty value.
create or replace function localized(field jsonb, lang text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(field ->> lang, ''),
    nullif(field ->> 'en', ''),
    (
      select v
      from jsonb_each_text(field) as kv(k, v)
      where v is not null and v <> ''
      limit 1
    )
  );
$$;

-- Build a tsvector from every locale present in a JSONB localized field.
-- Locale-agnostic ('simple' config) so it works for any language without
-- needing per-language Postgres text-search configs.
create or replace function localized_tsv(variadic fields jsonb[])
returns tsvector
language plpgsql
immutable
as $$
declare
  v tsvector := ''::tsvector;
  f jsonb;
  k text;
  val text;
begin
  foreach f in array fields loop
    if f is null then continue; end if;
    for k in select jsonb_object_keys(f) loop
      val := f ->> k;
      if val is not null and val <> '' then
        v := v || to_tsvector('simple', val);
      end if;
    end loop;
  end loop;
  return v;
end;
$$;

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----- profiles -------------------------------------------------------------
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  avatar_url      text,
  phone           text,
  preferred_locale text not null default 'en',
  role            user_role not null default 'buyer',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists profiles_touch on profiles;
create trigger profiles_touch
  before update on profiles
  for each row execute function touch_updated_at();

-- mirror auth.users → profiles
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----- categories -----------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  name        jsonb not null default '{}'::jsonb,
  description jsonb default '{}'::jsonb,
  icon        text,
  sort_order  integer not null default 0,
  parent_id   uuid references categories(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists categories_slug_idx on categories(slug);
create index if not exists categories_parent_idx on categories(parent_id);

drop trigger if exists categories_touch on categories;
create trigger categories_touch
  before update on categories
  for each row execute function touch_updated_at();

-- ----- products -------------------------------------------------------------
create table if not exists products (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null,
  category_id        uuid references categories(id) on delete set null,
  type               product_type not null,
  status             product_status not null default 'draft',
  title              jsonb not null default '{}'::jsonb,
  description_short  jsonb default '{}'::jsonb,
  description_long   jsonb default '{}'::jsonb,
  bullets            jsonb default '[]'::jsonb,
  thumbnail_url      text,
  gallery_urls       text[] default '{}',
  price_cents        integer not null,
  compare_at_cents   integer,
  currency           text not null default 'USD',
  content_languages  text[] default '{}',
  license_type       license_type not null default 'personal_use',
  download_limit     integer not null default 5,
  is_featured        boolean not null default false,
  sales_count        integer not null default 0,
  rating_avg         numeric(3,2) default 0,
  rating_count       integer not null default 0,
  search_text        tsvector,
  metadata           jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  published_at       timestamptz
);

create unique index if not exists products_slug_idx on products(slug);
create index if not exists products_category_idx on products(category_id);
create index if not exists products_status_idx on products(status);
create index if not exists products_type_idx on products(type);
create index if not exists products_featured_idx on products(is_featured);
create index if not exists products_search_idx on products using gin(search_text);

drop trigger if exists products_touch on products;
create trigger products_touch
  before update on products
  for each row execute function touch_updated_at();

create or replace function products_search_update()
returns trigger
language plpgsql
as $$
begin
  new.search_text := localized_tsv(new.title, new.description_short, new.description_long);
  return new;
end;
$$;

drop trigger if exists products_search_trigger on products;
create trigger products_search_trigger
  before insert or update of title, description_short, description_long on products
  for each row execute function products_search_update();

-- ----- product_files --------------------------------------------------------
create table if not exists product_files (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  filename     text not null,
  storage_path text not null,
  size_bytes   bigint not null,
  mime         text,
  version      integer not null default 1,
  created_at   timestamptz not null default now()
);

create index if not exists product_files_product_idx on product_files(product_id);

-- ----- orders ---------------------------------------------------------------
create table if not exists orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references profiles(id) on delete set null,
  status             order_status not null default 'pending',
  subtotal_cents     integer not null,
  discount_cents     integer not null default 0,
  total_cents        integer not null,
  currency           text not null default 'USD',
  payment_provider   payment_provider,
  payment_intent_id  text,
  coupon_id          uuid,
  email              text,
  metadata           jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  paid_at            timestamptz
);

create index if not exists orders_user_idx on orders(user_id);
create index if not exists orders_status_idx on orders(status);
create unique index if not exists orders_intent_idx on orders(payment_intent_id);

drop trigger if exists orders_touch on orders;
create trigger orders_touch
  before update on orders
  for each row execute function touch_updated_at();

-- ----- order_items ----------------------------------------------------------
create table if not exists order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  product_id      uuid not null references products(id) on delete restrict,
  title_snapshot  jsonb not null default '{}'::jsonb,
  unit_price_cents integer not null,
  quantity        integer not null default 1,
  created_at      timestamptz not null default now()
);

create index if not exists order_items_order_idx on order_items(order_id);
create index if not exists order_items_product_idx on order_items(product_id);

-- ----- downloads ------------------------------------------------------------
create table if not exists downloads (
  id                  uuid primary key default gen_random_uuid(),
  order_item_id       uuid not null references order_items(id) on delete cascade,
  user_id             uuid references profiles(id) on delete set null,
  file_id             uuid not null references product_files(id) on delete cascade,
  download_count      integer not null default 0,
  expires_at          timestamptz,
  last_downloaded_at  timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists downloads_user_idx on downloads(user_id);
create index if not exists downloads_order_item_idx on downloads(order_item_id);

-- ----- coupons --------------------------------------------------------------
create table if not exists coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null,
  discount_type   coupon_discount_type not null,
  discount_value  integer not null,
  min_order_cents integer not null default 0,
  usage_limit     integer,
  used_count      integer not null default 0,
  starts_at       timestamptz,
  expires_at      timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create unique index if not exists coupons_code_idx on coupons(code);

-- ----- reviews --------------------------------------------------------------
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  order_id    uuid references orders(id) on delete set null,
  rating      integer not null check (rating between 1 and 5),
  body        text,
  status      review_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reviews_product_idx on reviews(product_id);
create index if not exists reviews_user_idx on reviews(user_id);

drop trigger if exists reviews_touch on reviews;
create trigger reviews_touch
  before update on reviews
  for each row execute function touch_updated_at();

-- ----- ai_jobs --------------------------------------------------------------
create table if not exists ai_jobs (
  id           uuid primary key default gen_random_uuid(),
  agent        text not null,
  status       ai_job_status not null default 'queued',
  input        jsonb default '{}'::jsonb,
  output       jsonb default '{}'::jsonb,
  error        text,
  cost_usd     numeric(10,4) default 0,
  duration_ms  integer,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_jobs_agent_idx on ai_jobs(agent);
create index if not exists ai_jobs_status_idx on ai_jobs(status);

-- ----- audit_log ------------------------------------------------------------
create table if not exists audit_log (
  id           bigserial primary key,
  actor_id     uuid references profiles(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  diff         jsonb default '{}'::jsonb,
  ip           text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists audit_log_actor_idx on audit_log(actor_id);
create index if not exists audit_log_entity_idx on audit_log(entity_type, entity_id);

-- ----- newsletter -----------------------------------------------------------
create table if not exists newsletter_subscribers (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  preferred_locale text not null default 'en',
  subscribed_at    timestamptz not null default now(),
  unsubscribed_at  timestamptz
);

create unique index if not exists newsletter_email_idx on newsletter_subscribers(email);
