
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, sql, desc, gte, lte, or } from 'drizzle-orm';
import * as schema from './schema';
import type { InventoryItem, RecentOrder, ManagedUser, SecurityReport, GalleryPost, Communication, FuelHistoryEntry, UserArea, RegisteredVehicle, InventoryHistoryEntry } from './types';

if (!process.env.DATABASE_URL) {
  // throw new Error('DATABASE_URL environment variable is not set. Please add it to your .env file.');
  console.warn('DATABASE_URL environment variable is not set. Please add it to your .env file. Application will run with limited functionality.');
}

// For query purposes
const queryClient = postgres(process.env.DATABASE_URL || '');
export const db = drizzle(queryClient, { schema });

// INVENTORY
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const items = await db.query.inventoryItems.findMany({
       orderBy: [desc(schema.inventoryItems.name)],
    });
    return items.map(item => ({
      ...item,
      images: Array.isArray(item.images) ? item.images : [],
      expiryDate: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : undefined,
    })) as InventoryItem[];
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.message?.includes('failed to resolve')) {
      console.error('--------------------------------------------------');
      console.error('DATABASE CONNECTION ERROR: Hostname not found.');
      console.error('Please check the DATABASE_URL in your .env file.');
      console.error('It seems the Supabase server address is incorrect or unreachable.');
      console.error('--------------------------------------------------');
    } else {
      console.error('Error fetching inventory items:', error);
    }
    return [];
  }
}

export async function getInventoryHistory(): Promise<InventoryHistoryEntry[]> {
    try {
        const items = await db.query.inventoryHistory.findMany({
            orderBy: [desc(schema.inventoryHistory.date)],
        });
        return items.map(item => ({
            ...item,
            date: item.date.toISOString(),
        })) as InventoryHistoryEntry[];
    } catch (error) {
        console.error(`Error fetching from inventoryHistory:`, error);
        return [];
    }
}


// ORDERS
export async function getOrders(): Promise<RecentOrder[]> {
    try {
        const orders = await db.query.orders.findMany({
            with: {
                items: true,
            },
            orderBy: [desc(schema.orders.date)],
        });
        return orders.map(order => ({
            ...order,
            date: order.date.toISOString(),
        })) as RecentOrder[];
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

// USERS
export async function getUsers(): Promise<ManagedUser[]> {
    try {
        const users = await db.query.users.findMany({
            orderBy: [desc(schema.users.name)],
        });
        // Selectively return fields, excluding password
        return users.map(user => ({
            id: user.id,
            username: user.username,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            area: user.area,
            signatureUrl: user.signatureUrl || undefined,
        }));
    } catch (error) {
        console.error(`Error fetching from users:`, error);
        return [];
    }
}

// COMMUNICATIONS
export async function getCommunications(): Promise<Communication[]> {
    try {
        const items = await db.query.communications.findMany({
            orderBy: [desc(schema.communications.date)],
        });
        return items.map(item => ({
            ...item,
            images: Array.isArray(item.images) ? item.images : [],
            date: item.date.toISOString(),
        })) as Communication[];
    } catch (error) {
        console.error(`Error fetching from communications:`, error);
        return [];
    }
}

// GALLERY
export async function getGalleryPosts(): Promise<GalleryPost[]> {
    try {
        const items = await db.query.galleryPosts.findMany({
            orderBy: [desc(schema.galleryPosts.date)],
        });
        return items.map(item => ({
            ...item,
            images: Array.isArray(item.images) ? item.images : [],
            date: item.date.toISOString(),
        })) as GalleryPost[];
    } catch (error) {
        console.error(`Error fetching from galleryPosts:`, error);
        return [];
    }
}

// SECURITY
export async function getSecurityReports(): Promise<SecurityReport[]> {
     try {
        const items = await db.query.securityReports.findMany({
            orderBy: [desc(schema.securityReports.date)],
        });
        return items.map(item => ({
            ...item,
            photos: Array.isArray(item.photos) ? item.photos : [],
            date: item.date.toISOString(),
            meta: item.meta ? item.meta : undefined,
        })) as SecurityReport[];
    } catch (error) {
        console.error(`Error fetching from securityReports:`, error);
        return [];
    }
}

export async function getRegisteredVehicles(): Promise<RegisteredVehicle[]> {
    try {
        const items = await db.query.registeredVehicles.findMany();
        return items as RegisteredVehicle[];
    } catch (error) {
        console.error(`Error fetching from registeredVehicles:`, error);
        return [];
    }
}


// FUEL
export async function getFuelHistory(): Promise<FuelHistoryEntry[]> {
    try {
        const items = await db.query.fuelHistory.findMany({
            orderBy: [desc(schema.fuelHistory.date)],
        });
        return items.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            horometro: item.horometro ? Number(item.horometro) : undefined,
            kilometraje: item.kilometraje ? Number(item.kilometraje) : undefined,
            date: item.date.toISOString(),
        }));
    } catch (error) {
        console.error(`Error fetching from fuelHistory:`, error);
        return [];
    }
}

export async function getFuelLevels() {
    try {
        const result = await db
            .select({
                fuelType: schema.fuelHistory.fuelType,
                total: sql<number>`sum(case when type = 'Abastecimiento' then quantity::numeric else -quantity::numeric end)`.mapWith(Number),
            })
            .from(schema.fuelHistory)
            .groupBy(schema.fuelHistory.fuelType);

        const levels = {
            Gasolina: 0,
            Petróleo: 0,
        };

        for (const row of result) {
            if (row.fuelType === 'Gasolina' || row.fuelType === 'Petróleo') {
                levels[row.fuelType] = row.total;
            }
        }
        return levels;
    } catch (error) {
        console.error('Error fetching fuel levels:', error);
        return { Gasolina: 0, Petróleo: 0 };
    }
}

// DASHBOARD
export async function getDashboardData(currentUser: { area: UserArea, role: string }) {
    try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const today = new Date();

        const recentOrdersPromise = db.query.orders.findMany({
            orderBy: [desc(schema.orders.date)],
            limit: 5,
            with: { items: { columns: { id: true } } }
        });

        const expiringProductsPromise = db.query.inventoryItems.findMany({
            where: and(
                gte(schema.inventoryItems.stock, 1),
                schema.inventoryItems.expiryDate,
                lte(schema.inventoryItems.expiryDate, thirtyDaysFromNow.toISOString().split('T')[0]),
                gte(schema.inventoryItems.expiryDate, today.toISOString().split('T')[0])
            ),
            orderBy: [schema.inventoryItems.expiryDate],
            limit: 5
        });

        const inventoryStatsPromise = db.select({
            totalItems: sql<number>`count(*)`.mapWith(Number),
        }).from(schema.inventoryItems);

        const pendingOrdersCountPromise = db.select({
            count: sql<number>`count(*)`.mapWith(Number)
        }).from(schema.orders).where(eq(schema.orders.status, 'Pendiente'));

        const fuelLevelsPromise = getFuelLevels();

        const [recentOrdersResult, expiringProductsResult, inventoryStats, pendingOrders, fuelLevels] = await Promise.all([
            recentOrdersPromise,
            expiringProductsPromise,
            inventoryStatsPromise,
            pendingOrdersCountPromise,
            fuelLevelsPromise,
        ]);
        
        const recentOrders = recentOrdersResult.map(o => ({...o, date: o.date.toISOString()}));
        const expiringProducts = expiringProductsResult.map(p => ({...p, expiryDate: p.expiryDate ? p.expiryDate.toISOString().split('T')[0] : undefined}));

        return {
            recentOrders: recentOrders as RecentOrder[],
            expiringProducts,
            totalInventoryItems: inventoryStats[0]?.totalItems || 0,
            pendingOrdersCount: pendingOrders[0]?.count || 0,
            fuelLevels,
        };
    } catch (error: any) {
        if (error.code === 'ENOTFOUND' || error.message?.includes('failed to resolve')) {
          console.error('--------------------------------------------------');
          console.error('DATABASE CONNECTION ERROR: Hostname not found.');
          console.error('Please check the DATABASE_URL in your .env file.');
          console.error('It seems the Supabase server address is incorrect or unreachable.');
          console.error('--------------------------------------------------');
        } else {
          console.error('Error fetching dashboard data:', error);
        }
        return {
          recentOrders: [],
          expiringProducts: [],
          totalInventoryItems: 0,
          pendingOrdersCount: 0,
          fuelLevels: { Gasolina: 0, Petróleo: 0 },
        };
    }
}
