
-- Drop existing tables with cascade to handle dependencies
drop table if exists public.company_settings cascade;
drop table if exists public.fuel_history cascade;
drop table if exists public.fuel_levels cascade;
drop table if exists public.gallery_posts cascade;
drop table if exists public.inventory_history cascade;
drop table if exists public.inventory_items cascade;
drop table if exists public.messages cascade;
drop table if exists public.notifications cascade;
drop table if exists public.orders cascade;
drop table if exists public.communications cascade;
drop table if exists public.registered_vehicles cascade;
drop table if exists public.security_reports cascade;
drop table if exists public.users cascade;

-- Users table
create table public.users (
  id text primary key,
  username text not null unique,
  name text not null,
  last_name text not null,
  email text not null unique,
  "password" text not null,
  role text not null,
  area text not null,
  status text not null,
  avatar_url text,
  signature_url text,
  whatsapp_number text
);
alter table public.users enable row level security;
create policy "Allow all users to manage users" on public.users for all using (true);

-- Inventory Items table
create table public.inventory_items (
  id text primary key,
  name text not null,
  description text,
  category text not null,
  area text not null,
  cultivo text,
  location text not null,
  unit text not null,
  ai_hint text,
  images text[],
  technical_sheet_url text,
  batches jsonb
);
alter table public.inventory_items enable row level security;
create policy "Allow all users to manage inventory" on public.inventory_items for all using (true);


-- Inventory History table
create table public.inventory_history (
  id text primary key,
  date timestamp with time zone not null,
  product_id text references public.inventory_items(id) on delete set null,
  product_name text not null,
  type text not null,
  quantity numeric not null,
  unit text not null,
  requesting_area text not null,
  user_id text references public.users(id),
  order_id text,
  lote_id text
);
alter table public.inventory_history enable row level security;
create policy "Allow all users to manage inventory history" on public.inventory_history for all using (true);

-- Orders table
create table public.orders (
  id text primary key,
  date timestamp with time zone not null,
  items jsonb,
  status text not null,
  requesting_area text not null,
  requesting_user_id text references public.users(id)
);
alter table public.orders enable row level security;
create policy "Allow all authenticated users to manage orders" on public.orders for all using (true);

-- Communications table
create table public.communications (
  id text primary key,
  title text not null,
  description text not null,
  date timestamp with time zone not null,
  author_id text references public.users(id),
  ai_hint text
);
alter table public.communications enable row level security;
create policy "Allow all users to manage communications" on public.communications for all using (true);

-- Gallery Posts table
create table public.gallery_posts (
  id text primary key,
  title text not null,
  description text not null,
  author_id text references public.users(id),
  author_area text not null,
  date timestamp with time zone not null,
  status text not null,
  ai_hint text,
  images text[]
);
alter table public.gallery_posts enable row level security;
create policy "Allow all users to manage gallery posts" on public.gallery_posts for all using (true);

-- Security Reports table
create table public.security_reports (
  id text primary key,
  date timestamp with time zone not null,
  title text not null,
  description text not null,
  type text not null,
  author_id text references public.users(id),
  status text not null,
  meta jsonb,
  photos text[]
);
alter table public.security_reports enable row level security;
create policy "Allow all users to manage security reports" on public.security_reports for all using (true);

-- Registered Vehicles table
create table public.registered_vehicles (
  id text primary key,
  employee_id text references public.users(id) unique,
  employee_area text not null,
  vehicle_type text not null,
  vehicle_model text not null,
  vehicle_plate text not null
);
alter table public.registered_vehicles enable row level security;
create policy "Allow all users to manage registered vehicles" on public.registered_vehicles for all using (true);


-- Fuel Levels table
create table public.fuel_levels (
  id serial primary key,
  fuel_type text not null unique,
  level numeric not null
);
alter table public.fuel_levels enable row level security;
create policy "Allow all users to manage fuel levels" on public.fuel_levels for all using (true);

-- Fuel History table
create table public.fuel_history (
  id text primary key,
  date timestamp with time zone not null,
  type text not null,
  fuel_type text not null,
  quantity numeric not null,
  area text,
  user_name text,
  vehicle_type text,
  vehicle_model text,
  registered_by_id text references public.users(id),
  horometro numeric,
  kilometraje numeric
);
alter table public.fuel_history enable row level security;
create policy "Allow all users to manage fuel history" on public.fuel_history for all using (true);


-- Company Settings table
create table public.company_settings (
  id int primary key,
  support_whats_app text,
  logo_url text,
  login_bg_url text
);
alter table public.company_settings enable row level security;
create policy "Allow all users to manage company settings" on public.company_settings for all using (true);

-- Notifications table
create table public.notifications (
  id text primary key,
  recipient_id text not null,
  title text not null,
  description text not null,
  path text,
  is_read boolean not null default false,
  created_at timestamp with time zone default now() not null
);
alter table public.notifications enable row level security;
create policy "Allow all authenticated users to read notifications" on public.notifications for select using (true);
create policy "Allow users to insert notifications" on public.notifications for insert with check (true);
create policy "Allow users to update their own notifications" on public.notifications for update using (true) with check (true);


-- Messages for real-time chat
create table public.messages (
  id text primary key,
  created_at timestamp with time zone default now() not null,
  sender_id text references public.users(id),
  channel text not null,
  content text not null
);
alter table public.messages enable row level security;

-- FIX: Changed insert policy to be permissive as app doesn't use Supabase Auth JWTs.
create policy "Allow all users to read messages" on public.messages for select using (true);
create policy "Allow all users to insert messages" on public.messages for insert with check (true);


-- Setup Storage Buckets Policies
-- Note: Buckets must be created MANUALLY in the Supabase Dashboard.
-- These policies assume buckets named: 'products', 'gallery', 'avatars', 'signatures', 'company' exist and are public.

-- Products Bucket
drop policy if exists "Allow public read access to products" on storage.objects;
create policy "Allow public read access to products" on storage.objects for select using ( bucket_id = 'products' );
drop policy if exists "Allow authenticated uploads to products" on storage.objects;
create policy "Allow authenticated uploads to products" on storage.objects for insert with check ( bucket_id = 'products' );

-- Gallery Bucket
drop policy if exists "Allow public read access to gallery" on storage.objects;
create policy "Allow public read access to gallery" on storage.objects for select using ( bucket_id = 'gallery' );
drop policy if exists "Allow authenticated uploads to gallery" on storage.objects;
create policy "Allow authenticated uploads to gallery" on storage.objects for insert with check ( bucket_id = 'gallery' );

-- Avatars Bucket
drop policy if exists "Allow public read access to avatars" on storage.objects;
create policy "Allow public read access to avatars" on storage.objects for select using ( bucket_id = 'avatars' );
drop policy if exists "Allow authenticated uploads to avatars" on storage.objects;
create policy "Allow authenticated uploads to avatars" on storage.objects for insert with check ( bucket_id = 'avatars' );

-- Signatures Bucket
drop policy if exists "Allow public read access to signatures" on storage.objects;
create policy "Allow public read access to signatures" on storage.objects for select using ( bucket_id = 'signatures' );
drop policy if exists "Allow authenticated uploads to signatures" on storage.objects;
create policy "Allow authenticated uploads to signatures" on storage.objects for insert with check ( bucket_id = 'signatures' );

-- Company Bucket
drop policy if exists "Allow public read access to company" on storage.objects;
create policy "Allow public read access to company" on storage.objects for select using ( bucket_id = 'company' );
drop policy if exists "Allow authenticated uploads to company" on storage.objects;
create policy "Allow authenticated uploads to company" on storage.objects for insert with check ( bucket_id = 'company' );


-- Seed initial data

-- Admin user
insert into public.users (id, username, name, last_name, email, password, role, area, status, whatsapp_number)
values
  ('usr_gabriel', 'GabrielT', 'Gabriel', 'T', 'admin@agronorte.com', '003242373', 'Administrador', 'Administrador', 'active', '51999888777'),
  ('usr_ana_g', 'AnaG', 'Ana', 'G', 'gerencia@agronorte.com', 'password123', 'Gerencia', 'Gerencia', 'active', '51987654321'),
  ('usr_carlos_p', 'CarlosP', 'Carlos', 'P', 'almacen@agronorte.com', 'password123', 'Almacén', 'Almacén', 'active', '51912345678'),
  ('usr_juan_v', 'JuanV', 'Juan', 'V', 'produccion@agronorte.com', 'password123', 'Producción', 'Producción', 'active', '51998765432'),
  ('usr_seguridad', 'SeguridadV', 'Seguridad', 'Vigilante', 'seguridad@agronorte.com', 'password123', 'Seguridad Patrimonial', 'Seguridad Patrimonial', 'active', '51955555555');


-- Company Settings
insert into public.company_settings (id, support_whats_app, logo_url, login_bg_url)
values (1, '+51987654321', null, null);

-- Fuel Levels
insert into public.fuel_levels (fuel_type, level)
values ('Gasolina', 70), ('Petróleo', 1000);


-- Enable Realtime
-- This is a simplified approach. In a production environment, you might be more selective.
drop publication if exists supabase_realtime;
create publication supabase_realtime;

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;
