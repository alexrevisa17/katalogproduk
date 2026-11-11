-- Run in Supabase SQL Editor. API access is performed server-side with the service-role key.
create table if not exists public.products (
  id text primary key, name text not null, category text not null, price numeric(14,2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0), unit text not null default 'item', description text not null default '',
  image text not null default '', image_thumbnail text not null default '', image_detail text not null default '',
  available boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category);
create table if not exists public.store_config (
  id text primary key check (id = 'main'), store_name text not null, logo_url text not null, whatsapp_number text not null, updated_at timestamptz not null default now()
);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;
-- Keep tables private to browser clients. Server-side service-role calls bypass RLS.
alter table public.products enable row level security;
alter table public.store_config enable row level security;

grant all on table public.products to service_role;
grant all on table public.store_config to service_role;
