import { pgTable, varchar, text, integer, date, jsonb, timestamp, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===================
// INVENTARIO
// ===================
export const inventoryItems = pgTable('inventory_items', {
  id: varchar('id', { length: 255 }).primaryKey(), // SKU
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  area: varchar('area', { length: 50 }).notNull(),
  cultivo: varchar('cultivo', { length: 50 }),
  location: varchar('location', { length: 255 }),
  stock: integer('stock').notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull(),
  expiryDate: date('expiry_date'),
  status: varchar('status', { length: 50 }).notNull(),
  images: jsonb('images'),
  aiHint: varchar('ai_hint', { length: 255 }),
  technicalSheetUrl: varchar('technical_sheet_url', { length: 255 }),
  remissionGuideUrl: varchar('remission_guide_url', { length: 255 }),
});

// ===================
// USUARIOS
// ===================
export const users = pgTable('users', {
    id: varchar('id', { length: 255 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    area: varchar('area', { length: 50 }).notNull(),
    password: text('password').notNull(),
    signatureUrl: varchar('signature_url', { length: 255 }),
    whatsappNumber: varchar('whatsapp_number', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ===================
// PEDIDOS (SOLICITUDES)
// ===================
export const orders = pgTable('orders', {
    id: varchar('id', { length: 255 }).primaryKey(),
    date: timestamp('date').defaultNow().notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    requestingArea: varchar('requesting_area', { length: 50 }).notNull(),
    requestingUserName: varchar('requesting_user_name', { length: 255 }).notNull(),
    requestingUserSignatureUrl: varchar('requesting_user_signature_url', { length: 255 }),
    costCenter: varchar('cost_center', { length: 50 }),
    cultivo: varchar('cultivo', { length: 50 }),
    observations: text('observations'),
});

export const orderItems = pgTable('order_items', {
    id: varchar('id', { length: 255 }).primaryKey(),
    orderId: varchar('order_id', { length: 255 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
    itemId: varchar('item_id', { length: 255 }).notNull(), // No es una FK real a inventoryItems para desacoplar
    name: varchar('name', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    usageDescription: text('usage_description'),
});

export const orderRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));


// ===================
// COMUNICACIONES
// ===================
export const communications = pgTable('communications', {
    id: varchar('id', { length: 255 }).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    date: timestamp('date').defaultNow().notNull(),
    authorName: varchar('author_name', { length: 255 }).notNull(),
    images: jsonb('images'),
    aiHint: varchar('ai_hint', { length: 255 }),
});

// ===================
// GALERIA
// ===================
export const galleryPosts = pgTable('gallery_posts', {
    id: varchar('id', { length: 255 }).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    authorName: varchar('author_name', { length: 255 }).notNull(),
    authorArea: varchar('author_area', { length: 50 }).notNull(),
    date: timestamp('date').defaultNow().notNull(),
    images: jsonb('images'),
    status: varchar('status', { length: 50 }).notNull(),
    aiHint: varchar('ai_hint', { length: 255 }),
});

// ===================
// SEGURIDAD
// ===================
export const securityReports = pgTable('security_reports', {
    id: varchar('id', { length: 255 }).primaryKey(),
    date: timestamp('date').defaultNow().notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    author: varchar('author', { length: 255 }).notNull(),
    photos: jsonb('photos'),
    status: varchar('status', { length: 50 }).notNull(),
    meta: jsonb('meta'),
});

// ===================
// COMBUSTIBLE
// ===================
export const fuelHistory = pgTable('fuel_history', {
    id: varchar('id', { length: 255 }).primaryKey(),
    date: timestamp('date').defaultNow().notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    fuelType: varchar('fuel_type', { length: 50 }).notNull(),
    quantity: integer('quantity').notNull(),
    area: varchar('area', { length: 50 }),
    user: varchar('user_name', { length: 255 }),
    vehicleType: varchar('vehicle_type', { length: 50 }),
    registeredBy: varchar('registered_by', { length: 255 }).notNull(),
});
