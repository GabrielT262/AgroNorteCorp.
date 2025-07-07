-- POLÍTICAS DE ALMACENAMIENTO (STORAGE)
-- Estas políticas permiten que la aplicación suba y muestre archivos públicos
-- sin requerir que los usuarios estén autenticados.

-- Políticas para el bucket 'products'
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
CREATE POLICY "Give users access to own folder" ON storage.objects FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Allow public uploads to products" ON storage.objects;
CREATE POLICY "Allow public uploads to products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');

-- Políticas para el bucket 'gallery'
DROP POLICY IF EXISTS "Allow public access to gallery" ON storage.objects;
CREATE POLICY "Allow public access to gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Allow public uploads to gallery" ON storage.objects;
CREATE POLICY "Allow public uploads to gallery" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');

-- Políticas para el bucket 'avatars'
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
CREATE POLICY "Allow public access to avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Allow public uploads to avatars" ON storage.objects;
CREATE POLICY "Allow public uploads to avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Políticas para el bucket 'signatures'
DROP POLICY IF EXISTS "Allow public access to signatures" ON storage.objects;
CREATE POLICY "Allow public access to signatures" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');

DROP POLICY IF EXISTS "Allow public uploads to signatures" ON storage.objects;
CREATE POLICY "Allow public uploads to signatures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures');

-- Políticas para el bucket 'company'
DROP POLICY IF EXISTS "Allow public access to company" ON storage.objects;
CREATE POLICY "Allow public access to company" ON storage.objects FOR SELECT USING (bucket_id = 'company');

DROP POLICY IF EXISTS "Allow public uploads to company" ON storage.objects;
CREATE POLICY "Allow public uploads to company" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company');


-- BORRADO DE TABLAS EXISTENTES
-- Esto asegura que empezamos desde un estado limpio.
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.fuel_levels CASCADE;
DROP TABLE IF EXISTS public.fuel_history CASCADE;
DROP TABLE IF EXISTS public.gallery_posts CASCADE;
DROP TABLE IF EXISTS public.communications CASCADE;
DROP TABLE IF EXISTS public.inventory_history CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.security_reports CASCADE;
DROP TABLE IF EXISTS public.registered_vehicles CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- CREACIÓN DE TABLAS

-- Tabla de Usuarios
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    area TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    avatar_url TEXT,
    signature_url TEXT,
    whatsapp_number TEXT
);

-- Tabla de Items de Inventario
CREATE TABLE public.inventory_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    area TEXT NOT NULL,
    cultivo TEXT,
    location TEXT,
    unit TEXT NOT NULL,
    ai_hint TEXT,
    images TEXT[],
    technical_sheet_url TEXT,
    batches JSONB NOT NULL
);

-- Tabla de Órdenes
CREATE TABLE public.orders (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    items JSONB NOT NULL,
    status TEXT NOT NULL,
    requesting_area TEXT NOT NULL,
    requesting_user_id TEXT REFERENCES public.users(id)
);

-- Tabla de Historial de Inventario
CREATE TABLE public.inventory_history (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    product_id TEXT REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    requesting_area TEXT,
    user_id TEXT REFERENCES public.users(id),
    order_id TEXT,
    lote_id TEXT
);

-- Tabla de Comunicados
CREATE TABLE public.communications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    author_id TEXT REFERENCES public.users(id),
    ai_hint TEXT
);

-- Tabla de Publicaciones de Galería
CREATE TABLE public.gallery_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author_id TEXT REFERENCES public.users(id),
    author_area TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    ai_hint TEXT,
    images TEXT[]
);

-- Tabla de Reportes de Seguridad
CREATE TABLE public.security_reports (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    author_id TEXT REFERENCES public.users(id),
    status TEXT NOT NULL,
    meta JSONB,
    photos TEXT[]
);

-- Tabla de Vehículos Registrados
CREATE TABLE public.registered_vehicles (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.users(id) UNIQUE,
    employee_area TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_plate TEXT NOT NULL
);

-- Tabla de Historial de Combustible
CREATE TABLE public.fuel_history (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    area TEXT,
    user_name TEXT,
    vehicle_type TEXT,
    vehicle_model TEXT,
    registered_by_id TEXT REFERENCES public.users(id),
    horometro NUMERIC,
    kilometraje NUMERIC
);

-- Tabla de Niveles de Combustible
CREATE TABLE public.fuel_levels (
    fuel_type TEXT PRIMARY KEY,
    level NUMERIC NOT NULL
);

-- Tabla de Notificaciones
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    path TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Configuración de la Empresa
CREATE TABLE public.company_settings (
    id INT PRIMARY KEY,
    support_whats_app TEXT,
    logo_url TEXT,
    login_bg_url TEXT
);

-- Tabla de Mensajes del Chat
CREATE TABLE public.messages (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sender_id TEXT REFERENCES public.users(id),
    channel TEXT NOT NULL,
    content TEXT NOT NULL
);


-- HABILITACIÓN DE RLS (ROW LEVEL SECURITY)
-- Es una buena práctica habilitar RLS en todas las tablas.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACCESO (RLS Policies)
-- Define quién puede hacer qué en cada tabla.

-- La mayoría de estas políticas permiten el acceso total porque es una aplicación interna.
-- En un entorno de producción más complejo, se podrían restringir más.
-- Por ejemplo, un usuario solo podría ver los pedidos de su propia área.

DROP POLICY IF EXISTS "Enable all access for all users" ON public.users;
CREATE POLICY "Enable all access for all users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.inventory_items;
CREATE POLICY "Enable all access for all users" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.orders;
CREATE POLICY "Enable all access for all users" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.inventory_history;
CREATE POLICY "Enable all access for all users" ON public.inventory_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.communications;
CREATE POLICY "Enable all access for all users" ON public.communications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.gallery_posts;
CREATE POLICY "Enable all access for all users" ON public.gallery_posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.security_reports;
CREATE POLICY "Enable all access for all users" ON public.security_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.registered_vehicles;
CREATE POLICY "Enable all access for all users" ON public.registered_vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.fuel_history;
CREATE POLICY "Enable all access for all users" ON public.fuel_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.fuel_levels;
CREATE POLICY "Enable all access for all users" ON public.fuel_levels FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.company_settings;
CREATE POLICY "Enable all access for all users" ON public.company_settings FOR ALL USING (true) WITH CHECK (true);

-- Políticas para Mensajes (Chat)
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.messages;
CREATE POLICY "Allow insert for authenticated users" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access for all users" ON public.messages;
CREATE POLICY "Allow read access for all users" ON public.messages FOR SELECT USING (true);


-- Políticas para Notificaciones
-- CORRECCIÓN: Se simplifica la política para permitir la lectura y evitar problemas de conexión en tiempo real.
DROP POLICY IF EXISTS "Enable read access for specific users" ON public.notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notifications;
CREATE POLICY "Enable read access for all users" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.notifications;
CREATE POLICY "Enable insert for all users" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.notifications;
CREATE POLICY "Enable update for all users" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);


-- HABILITAR SUPABASE REALTIME
-- Esto le dice a Supabase que "escuche" los cambios en estas tablas.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- INSERCIÓN DE DATOS INICIALES

-- Insertar usuario administrador principal
INSERT INTO public.users (id, username, name, last_name, email, password, role, area, status) VALUES
('usr_gabriel', 'GabrielT', 'Gabriel', 'T', 'admin@agronorte.com', '003242373', 'Administrador', 'Administrador', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insertar niveles iniciales de combustible
INSERT INTO public.fuel_levels (fuel_type, level) VALUES
('Gasolina', 50),
('Petróleo', 800)
ON CONFLICT (fuel_type) DO UPDATE SET level = EXCLUDED.level;

-- Insertar configuración inicial de la empresa
INSERT INTO public.company_settings (id, support_whats_app, logo_url, login_bg_url) VALUES
(1, '+51987654321', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

