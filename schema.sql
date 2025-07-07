-- ================================================================================================
-- POLÍTICAS DE ALMACENAMIENTO (STORAGE)
-- Estas políticas otorgan acceso de lectura y escritura a los buckets para el desarrollo.
-- Para un entorno de producción, se recomienda restringir el acceso de escritura solo a usuarios autenticados.
-- ================================================================================================

-- Policies for 'avatars' bucket
CREATE POLICY "Public read for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public write for avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Public update for avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

-- Policies for 'company' bucket
CREATE POLICY "Public read for company" ON storage.objects FOR SELECT USING (bucket_id = 'company');
CREATE POLICY "Public write for company" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company');
CREATE POLICY "Public update for company" ON storage.objects FOR UPDATE USING (bucket_id = 'company');

-- Policies for 'gallery' bucket
CREATE POLICY "Public read for gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Public write for gallery" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "Public update for gallery" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery');

-- Policies for 'products' bucket
CREATE POLICY "Public read for products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public write for products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "Public update for products" ON storage.objects FOR UPDATE USING (bucket_id = 'products');

-- Policies for 'signatures' bucket
CREATE POLICY "Public read for signatures" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
CREATE POLICY "Public write for signatures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures');
CREATE POLICY "Public update for signatures" ON storage.objects FOR UPDATE USING (bucket_id = 'signatures');


-- ================================================================================================
-- ESQUEMA DE BASE DE DATOS
-- Este script crea todas las tablas necesarias y carga datos iniciales.
-- ================================================================================================

-- Eliminar tablas existentes para una instalación limpia
DROP TABLE IF EXISTS "inventory_history" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "inventory_items" CASCADE;
DROP TABLE IF EXISTS "communications" CASCADE;
DROP TABLE IF EXISTS "gallery_posts" CASCADE;
DROP TABLE IF EXISTS "security_reports" CASCADE;
DROP TABLE IF EXISTS "registered_vehicles" CASCADE;
DROP TABLE IF EXISTS "fuel_history" CASCADE;
DROP TABLE IF EXISTS "fuel_levels" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "company_settings" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;


-- Creación de la tabla de usuarios
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    area VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    avatar_url TEXT,
    signature_url TEXT
);

-- Creación de la tabla de inventario
CREATE TABLE inventory_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    area VARCHAR(50) NOT NULL,
    cultivo VARCHAR(50),
    location VARCHAR(255),
    unit VARCHAR(50) NOT NULL,
    ai_hint TEXT,
    images TEXT[],
    technical_sheet_url TEXT,
    batches JSONB NOT NULL
);

-- Creación de la tabla de pedidos
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    items JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    requesting_area VARCHAR(50) NOT NULL,
    requesting_user_id VARCHAR(255),
    FOREIGN KEY (requesting_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Creación de la tabla de historial de inventario
CREATE TABLE inventory_history (
    id VARCHAR(255) PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    product_id VARCHAR(255),
    product_name VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    quantity NUMERIC NOT NULL,
    unit VARCHAR(50),
    requesting_area VARCHAR(50),
    user_id VARCHAR(255),
    order_id VARCHAR(255),
    lote_id VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES inventory_items(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Creación de la tabla de comunicados
CREATE TABLE communications (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    author_id VARCHAR(255),
    ai_hint TEXT,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Creación de la tabla de galería
CREATE TABLE gallery_posts (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id VARCHAR(255),
    author_area VARCHAR(50),
    date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL,
    ai_hint TEXT,
    images TEXT[],
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Creación de la tabla de reportes de seguridad
CREATE TABLE security_reports (
    id VARCHAR(255) PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    author_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    meta JSONB,
    photos TEXT[],
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Creación de la tabla de vehículos registrados
CREATE TABLE registered_vehicles (
    id VARCHAR(255) PRIMARY KEY,
    employee_id VARCHAR(255) UNIQUE NOT NULL,
    employee_area VARCHAR(50),
    vehicle_type VARCHAR(255),
    vehicle_model VARCHAR(255),
    vehicle_plate VARCHAR(255),
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Creación de la tabla de niveles de combustible
CREATE TABLE fuel_levels (
    fuel_type VARCHAR(50) PRIMARY KEY,
    level NUMERIC NOT NULL
);

-- Creación de la tabla de historial de combustible
CREATE TABLE fuel_history (
    id VARCHAR(255) PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL,
    type VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    quantity NUMERIC NOT NULL,
    area VARCHAR(50),
    user_name VARCHAR(255),
    vehicle_type VARCHAR(50),
    registered_by_id VARCHAR(255),
    horometro NUMERIC,
    kilometraje NUMERIC,
    FOREIGN KEY (registered_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Creación de la tabla de notificaciones
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    recipient_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    path TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creación de la tabla de configuración de la empresa
CREATE TABLE company_settings (
    id INT PRIMARY KEY,
    support_whats_app TEXT,
    logo_url TEXT,
    login_bg_url TEXT
);


-- Insertar datos iniciales
INSERT INTO users (id, username, name, last_name, email, role, area, password, status, avatar_url) VALUES
('usr_gabriel', 'GabrielT', 'Gabriel', 'Torres', 'gabriel.t@agronorte.com', 'Administrador', 'Administrador', '003242373', 'active', 'https://placehold.co/100x100.png');

INSERT INTO company_settings (id, support_whats_app, logo_url, login_bg_url) VALUES
(1, '+51987654321', null, null);

INSERT INTO fuel_levels (fuel_type, level) VALUES
('Gasolina', 50.0),
('Petróleo', 500.0);
