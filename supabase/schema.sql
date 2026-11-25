-- DAHRIOLA store database (Supabase / Postgres).
--
-- Run this once in Supabase → SQL Editor → New query → Run.
-- It is safe to run again: nothing existing is dropped or overwritten.
--
-- Security model: every table has Row Level Security switched on with no
-- policies, so the public (anon) key can read and write nothing. The website
-- talks to the database only from the server, with the service-role key.

-- Text IDs (not uuid columns) so the IDs products already have in Sanity can be
-- kept. Customers' saved carts, wishlists and shared lists point at those IDs.
create or replace function public.new_id() returns text
  language sql volatile as $$ select gen_random_uuid()::text $$;

create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────────────────────── Catalogue ─────────────────────────────

create table if not exists public.categories (
  id               text primary key default public.new_id(),
  title            text not null,
  slug             text not null unique,
  composition_care text,
  size_fit         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.prints (
  id                  text primary key default public.new_id(),
  name                text not null,
  image_url           text,
  stock_quantity      integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 2 check (low_stock_threshold >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.products (
  id                text primary key default public.new_id(),
  name              text not null,
  slug              text not null unique,
  brief_description text,
  product_type      text not null default 'ready-to-wear',
  category_id       text references public.categories(id) on delete set null,
  images            text[] not null default '{}',
  price_ngn         numeric(12,2),
  compare_at_price  numeric(12,2),
  production_time   text,
  description       text,
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_created_idx on public.products(created_at desc);

create table if not exists public.product_prints (
  product_id text not null references public.products(id) on delete cascade,
  print_id   text not null references public.prints(id) on delete cascade,
  position   integer not null default 0,
  primary key (product_id, print_id)
);
create index if not exists product_prints_print_idx on public.product_prints(print_id);

create table if not exists public.reviews (
  id         text primary key default public.new_id(),
  product_id text not null references public.products(id) on delete cascade,
  name       text not null,
  rating     integer not null check (rating between 1 and 5),
  title      text,
  comment    text not null,
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews(product_id, approved);

create table if not exists public.coupons (
  id               text primary key default public.new_id(),
  code             text not null unique,
  discount_type    text not null default 'percentage' check (discount_type in ('percentage', 'fixed')),
  discount_value   numeric(12,2) not null default 0 check (discount_value >= 0),
  is_active        boolean not null default true,
  first_order_only boolean not null default false,
  expiry_date      timestamptz,
  assigned_email   text,
  usage_limit      integer check (usage_limit is null or usage_limit >= 1),
  times_used       integer not null default 0,
  purpose          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ────────────────────────────── Orders ───────────────────────────────

create table if not exists public.orders (
  id                     text primary key default public.new_id(),
  order_number           text not null,
  -- null on orders placed before status tracking existed; those never get emails
  status                 text check (status is null or status in
                           ('received','in_production','ready','shipped','out_for_delivery','delivered','cancelled')),
  courier                text,
  tracking_number        text,
  tracking_url           text,
  status_note            text,
  status_emailed_for     text,
  status_history         jsonb not null default '[]'::jsonb,   -- [{ status, at, note? }]
  delivered              boolean not null default false,
  delivered_at           timestamptz,
  review_request_sent_at timestamptz,
  receipt_sent_at        timestamptz,
  customer_name          text,
  customer_email         text,
  customer_phone         text,
  shipping_address       text,
  shipping_method        text,
  -- [{ productId, name, price, quantity, size, selectedPrintName, heightLength, gender, notes }]
  items                  jsonb not null default '[]'::jsonb,
  currency               text default 'NGN',
  subtotal               numeric(12,2),
  shipping_fee           numeric(12,2),
  discount_code          text,
  discount_amount        numeric(12,2),
  total_amount           numeric(12,2),
  amount_paid            numeric(12,2),
  display_currency       text,
  display_total          numeric(12,2),
  payment_reference      text,
  payment_verified       boolean not null default false,
  verification_note      text,
  is_gift                boolean not null default false,
  gift_recipient         text,
  gift_deliver_to_owner  boolean,
  gift_message           text,
  gift_list_id           text,
  email_opt_in           boolean not null default false,
  text_opt_in            boolean not null default false,
  internal_note          text,                                  -- staff only, never shown to customers
  -- true while the customer hasn't been told about the current status yet
  status_email_pending   boolean generated always as (status is not null and status is distinct from status_emailed_for) stored,
  -- lowercase copies for exact, case-insensitive lookups
  order_number_lc        text generated always as (lower(btrim(order_number))) stored,
  customer_email_lc      text generated always as (lower(btrim(customer_email))) stored,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_number_idx on public.orders(order_number_lc);
create index if not exists orders_email_idx on public.orders(customer_email_lc);
create index if not exists orders_reference_idx on public.orders(payment_reference);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_status_pending_idx on public.orders(id) where status_email_pending;

-- ────────────────────────────── Events ───────────────────────────────

create table if not exists public.events (
  id                   text primary key default public.new_id(),
  title                text not null,
  slug                 text not null unique,
  tagline              text,
  start_date           timestamptz not null,
  end_date             timestamptz not null,
  venue_name           text,
  venue_address        text,
  map_link             text,
  flyer_url            text,
  description          text,
  capacity             integer,
  max_guests           integer not null default 1,
  rsvp_open            boolean not null default true,
  show_popup           boolean not null default false,
  theme                text default 'default',
  gallery              jsonb not null default '[]'::jsonb,       -- [{ url, width, height, caption }]
  videos               text[] not null default '{}',
  video_files          jsonb not null default '[]'::jsonb,       -- [{ url, mimeType, caption }]
  recap                text,
  featured_product_ids text[] not null default '{}',
  follow_ups_enabled   boolean not null default false,
  attendee_code        text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists events_dates_idx on public.events(start_date desc);

create table if not exists public.rsvps (
  id                  text primary key default public.new_id(),
  event_id            text not null references public.events(id) on delete cascade,
  name                text,
  email               text,
  phone               text,
  guests              integer not null default 0,
  source              text,
  marketing_opt_in    boolean not null default false,
  ticket_code         text,
  checked_in          boolean not null default false,
  checked_in_at       timestamptz,
  reminder48_sent_at  timestamptz,
  reminder24_sent_at  timestamptz,
  follow_up_sent_at   timestamptz,
  follow_up_type      text,
  email_lc            text generated always as (lower(btrim(email))) stored,
  created_at          timestamptz not null default now()
);
create index if not exists rsvps_event_idx on public.rsvps(event_id, created_at);
create index if not exists rsvps_ticket_idx on public.rsvps(ticket_code);
create index if not exists rsvps_email_idx on public.rsvps(email_lc);

-- ─────────────────────── Shared lists (gifting) ──────────────────────

create table if not exists public.shared_lists (
  id               text primary key default public.new_id(),
  kind             text not null default 'wishlist' check (kind in ('wishlist', 'cart')),
  public_id        text not null unique,
  message          text,
  keep_surprise    boolean not null default true,
  active           boolean not null default true,
  -- [{ key, productId, productName, size, selectedPrintId, selectedPrintName, heightLength,
  --    gender, notes, quantity, purchased, purchasedAt, purchasedBy, orderReference }]
  items            jsonb not null default '[]'::jsonb,
  owner_name       text,
  owner_email      text,
  edit_token_hash  text,
  delivery_address jsonb,                                        -- private: never sent to gift buyers
  owner_email_lc   text generated always as (lower(btrim(owner_email))) stored,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists shared_lists_owner_idx on public.shared_lists(owner_email_lc);

-- ───────────────────────────── Marketing ─────────────────────────────

-- One row holding the on/off switches and discounts for the automatic emails
create table if not exists public.marketing_settings (
  id         integer primary key default 1 check (id = 1),
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.marketing_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.stock_alerts (
  id          text primary key default public.new_id(),
  email       text not null,
  product_id  text references public.products(id) on delete cascade,
  print_id    text references public.prints(id) on delete cascade,
  created_at  timestamptz not null default now(),
  notified_at timestamptz
);
create index if not exists stock_alerts_open_idx on public.stock_alerts(print_id) where notified_at is null;
create index if not exists stock_alerts_email_idx on public.stock_alerts(email);

create table if not exists public.marketing_log (
  id          text primary key default public.new_id(),
  email       text not null,
  kind        text,
  key         text,
  coupon_code text,
  sent_at     timestamptz not null default now()
);
create index if not exists marketing_log_key_idx on public.marketing_log(email, key);
create index if not exists marketing_log_sent_idx on public.marketing_log(sent_at desc);

create table if not exists public.marketing_opt_outs (
  email      text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.abandoned_carts (
  id               text primary key,                             -- derived from the email, one per shopper
  email            text not null,
  name             text,
  subtotal         numeric(12,2),
  items            jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  reminder_sent_at timestamptz,
  recovered_at     timestamptz
);
create index if not exists abandoned_carts_updated_idx on public.abandoned_carts(updated_at desc);
create index if not exists abandoned_carts_email_idx on public.abandoned_carts(email);

create table if not exists public.browse_activity (
  id                  text primary key,                          -- derived from the email
  email               text not null,
  views               jsonb not null default '[]'::jsonb,        -- [{ productId, name, count, lastAt }]
  last_viewed_at      timestamptz,
  last_engaged_at     timestamptz,
  sequence_started_at timestamptz,
  step                integer not null default 0,
  last_step_at        timestamptz,
  converted_at        timestamptz
);
create index if not exists browse_activity_viewed_idx on public.browse_activity(last_viewed_at desc);

-- ──────────────────────────── Dashboard ──────────────────────────────

-- Who may sign in to /admin. A Supabase Auth account alone is not enough.
create table if not exists public.admin_users (
  email      text primary key check (email = lower(btrim(email))),   -- always lowercase
  name       text,
  role       text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

-- ───────────────────────────── Triggers ──────────────────────────────

do $$
declare t text;
begin
  foreach t in array array['categories','prints','products','coupons','orders','events','shared_lists','marketing_settings']
  loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ──────────────────────── Atomic stock & coupons ─────────────────────
-- Done in the database so two orders at the same moment can't overwrite
-- each other's numbers.

create or replace function public.decrement_print_stock(p_print_id text, p_quantity integer)
returns table (name text, stock_quantity integer, low_stock_threshold integer)
language sql security definer set search_path = public as $$
  update public.prints p
     set stock_quantity = greatest(0, p.stock_quantity - greatest(1, coalesce(p_quantity, 1)))
   where p.id = p_print_id
  returning p.name, p.stock_quantity, p.low_stock_threshold;
$$;

create or replace function public.record_coupon_use(p_code text)
returns void
language sql security definer set search_path = public as $$
  update public.coupons set times_used = times_used + 1 where upper(code) = upper(p_code);
$$;

revoke all on function public.decrement_print_stock(text, integer) from public, anon, authenticated;
revoke all on function public.record_coupon_use(text) from public, anon, authenticated;
grant execute on function public.decrement_print_stock(text, integer) to service_role;
grant execute on function public.record_coupon_use(text) to service_role;

-- ────────────────────────── Row Level Security ───────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'categories','prints','products','product_prints','reviews','coupons','orders','events','rsvps',
    'shared_lists','marketing_settings','stock_alerts','marketing_log','marketing_opt_outs',
    'abandoned_carts','browse_activity','admin_users']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ───────────────────────────── Storage ───────────────────────────────
-- One public bucket for product photos, print swatches, event flyers,
-- galleries and short video clips. Anyone can view a file by its link;
-- uploads only happen through the dashboard (signed by the server).

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

-- ───────────────────────────── Privileges ────────────────────────────
-- Belt and braces: the public keys get no access to these tables at all,
-- even if Row Level Security were switched off on one by mistake.

revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
alter default privileges in schema public revoke all on tables from anon, authenticated;
