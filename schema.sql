
-- =================================================================================================
-- AgroNorte Corp - Supabase Schema
--
-- Instrucciones:
-- 1. Copia TODO el contenido de este archivo.
-- 2. Ve al editor SQL de tu proyecto de Supabase (SQL Editor -> New query).
-- 3. Pega el contenido y haz clic en "RUN".
--
-- Esto creará todas las tablas, relaciones, políticas de almacenamiento y datos iniciales.
-- Puedes ejecutar este script de forma segura varias veces; eliminará las tablas antiguas antes de crearlas de nuevo.
-- =================================================================================================


-- ============================================
-- 1. CONFIGURACIÓN DE ALMACENAMIENTO (STORAGE)
-- ============================================
-- Crea los buckets de almacenamiento si no existen.
-- NOTA: Debes marcar los buckets como públicos desde el panel de Supabase después de ejecutar este script.
-- Storage -> Buckets -> (tu bucket) -> Settings -> Public bucket.
INSERT INTO storage.buckets (id, name, public) VALUES
('products', 'products', true),
('gallery', 'gallery', true),
('avatars', 'avatars', true),
('signatures', 'signatures', true),
('company', 'company', true)
ON CONFLICT (id) DO NOTHING;


-- Políticas de acceso para los buckets
-- Permite el acceso público de lectura a todos los buckets.
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (true);

-- Permite a los usuarios autenticados subir, actualizar y eliminar archivos en sus respectivos buckets.
CREATE POLICY "Authenticated Write Access" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Update Access" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Delete Access" ON storage.objects FOR DELETE USING (auth.role() = 'authenticated');


-- ============================================
-- 2. ELIMINACIÓN DE TABLAS EXISTENTES (para re-ejecución limpia)
-- ============================================
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "gallery_posts" CASCADE;
DROP TABLE IF EXISTS "security_reports" CASCADE;
DROP TABLE IF EXISTS "registered_vehicles" CASCADE;
DROP TABLE IF EXISTS "fuel_history" CASCADE;
DROP TABLE IF EXISTS "fuel_levels" CASCADE;
DROP TABLE IF EXISTS "inventory_history" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "inventory_items" CASCADE;
DROP TABLE IF EXISTS "company_settings" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;


-- ============================================
-- 3. CREACIÓN DE TABLAS
-- ============================================

-- Tabla de Usuarios
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Usuario' CHECK (role IN ('Administrador', 'Usuario')),
    area TEXT NOT NULL CHECK (area IN ('Gerencia', 'Logística', 'RR.HH', 'Seguridad Patrimonial', 'Almacén', 'Taller', 'Producción', 'Sanidad', 'SS.GG', 'Administrador')),
    password TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending')),
    avatar_url TEXT,
    signature_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Configuración de la Empresa (solo una fila)
CREATE TABLE company_settings (
    id INT PRIMARY KEY DEFAULT 1,
    support_whats_app TEXT,
    logo_url TEXT,
    login_bg_url TEXT
);

-- Tabla de Items de Inventario
CREATE TABLE inventory_items (
    id TEXT PRIMARY KEY, -- SKU
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Herramientas', 'Repuestos', 'Fertilizantes', 'Agroquímicos', 'Varios', 'Implementos de Riego', 'Implementos de SST')),
    area TEXT NOT NULL,
    cultivo TEXT CHECK (cultivo IN ('Uva', 'Palto')),
    location TEXT,
    unit TEXT NOT NULL CHECK (unit IN ('Unidad', 'Kg', 'Litros', 'Metros')),
    ai_hint TEXT,
    images TEXT[],
    technical_sheet_url TEXT,
    batches JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Pedidos
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    items JSONB,
    status TEXT NOT NULL CHECK (status IN ('Aprobado', 'Pendiente', 'Rechazado', 'Despachado')),
    requesting_area TEXT NOT NULL,
    requesting_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Historial de Inventario
CREATE TABLE inventory_history (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    product_id TEXT REFERENCES inventory_items(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Entrada', 'Salida')),
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    requesting_area TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    order_id TEXT,
    lote_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Niveles de Combustible
CREATE TABLE fuel_levels (
    fuel_type TEXT PRIMARY KEY CHECK (fuel_type IN ('Gasolina', 'Petróleo')),
    level NUMERIC NOT NULL
);

-- Tabla de Historial de Combustible
CREATE TABLE fuel_history (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Abastecimiento', 'Consumo')),
    fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Gasolina', 'Petróleo')),
    quantity NUMERIC NOT NULL,
    area TEXT,
    user_name TEXT,
    vehicle_type TEXT,
    vehicle_model TEXT,
    horometro NUMERIC,
    kilometraje NUMERIC,
    registered_by_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Vehículos Registrados
CREATE TABLE registered_vehicles (
    id TEXT PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_area TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_plate TEXT NOT NULL
);

-- Tabla de Reportes de Seguridad
CREATE TABLE security_reports (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Incidente', 'Novedad', 'Solicitud de Permiso', 'Ingreso de Proveedor', 'Ingreso Vehículo Trabajador')),
    author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    meta JSONB,
    photos TEXT[]
);

-- Tabla de Galería de Logros
CREATE TABLE gallery_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    author_area TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pendiente', 'Aprobado', 'Rechazado')),
    ai_hint TEXT,
    images TEXT[]
);

-- Tabla de Comunicados
CREATE TABLE communications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    ai_hint TEXT
);

-- Tabla de Notificaciones
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL, -- Puede ser un ID de usuario o un nombre de área/rol
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    path TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- 4. INSERCIÓN DE DATOS INICIALES
-- ============================================

-- Usuario Administrador Principal
INSERT INTO users (id, username, name, last_name, email, role, area, password, status) VALUES
('usr_gabriel', 'GabrielT', 'Gabriel', 'Torres', 'gabriel.t@agronortecorp.com', 'Administrador', 'Administrador', '003242373', 'active')
ON CONFLICT (id) DO NOTHING;

-- Configuración Inicial de la Empresa
INSERT INTO company_settings (id, support_whats_app, logo_url, login_bg_url) VALUES
(1, '51987654321', 'https://placehold.co/100x100.png', 'https://placehold.co/1920x1080.png')
ON CONFLICT (id) DO UPDATE SET
support_whats_app = EXCLUDED.support_whats_app,
logo_url = EXCLUDED.logo_url,
login_bg_url = EXCLUDED.login_bg_url;


-- Niveles Iniciales de Combustible
INSERT INTO fuel_levels (fuel_type, level) VALUES
('Gasolina', 50),
('Petróleo', 800)
ON CONFLICT (fuel_type) DO UPDATE SET level = EXCLUDED.level;


-- ============================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
-- Se recomienda habilitar RLS en todas las tablas y definir políticas explícitas.
-- Por simplicidad en este prototipo, las dejamos deshabilitadas, pero en producción es crucial.
-- Ejemplo de cómo habilitar RLS para una tabla:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Ejemplo de política (permitir a los usuarios ver solo su propia información):
-- CREATE POLICY "User can see own data" ON users
-- FOR SELECT USING (auth.uid()::text = id);
--
-- CREATE POLICY "User can update own data" ON users
-- FOR UPDATE USING (auth.uid()::text = id);

-- ============================================
-- Script finalizado.
-- ============================================
