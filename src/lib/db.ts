
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, sql, desc, gte, lte, or } from 'drizzle-orm';
import * as schema from './schema';
import type { InventoryItem, RecentOrder, ManagedUser, SecurityReport, GalleryPost, Communication, FuelHistoryEntry, UserArea, RegisteredVehicle } from './types';

if (!process.env.DATABASE_URL) {
  // throw new Error('DATABASE_URL environment variable is not set. Please add it to your .env file.');
  console.warn('DATABASE_URL environment variable is not set. Please add it to your .env file. Application will run with limited functionality.');
}

// For query purposes
const queryClient = postgres(process.env.DATABASE_URL || '');
export const db = drizzle(queryClient, { schema });

// GENERIC GETTER
export async function getAllFromTable<T>(tableName: keyof typeof schema): Promise<T[]> {
  try {
    // @ts-ignore
    const items = await db.query[tableName].findMany({
      orderBy: [desc(schema[tableName].date || schema[tableName].createdAt)],
    });
    return items as T[];
  } catch (error) {
    console.error(`Error fetching from ${tableName}:`, error);
    return [];
  }
}

// INVENTORY
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const items = await db.query.inventoryItems.findMany({
       orderBy: [desc(schema.inventoryItems.name)],
    });
    return items.map(item => ({
      ...item,
      images: Array.isArray(item.images) ? item.images : [],
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

export async function deleteInventoryItem(id: string): Promise<{ success: boolean }> {
  try {
    await db.delete(schema.inventoryItems).where(eq(schema.inventoryItems.id, id));
    return { success: true };
  } catch (error: any) {
     if (error.code === 'ENOTFOUND' || error.message?.includes('failed to resolve')) {
      console.error('--------------------------------------------------');
      console.error('DATABASE CONNECTION ERROR: Hostname not found.');
      console.error('Please check the DATABASE_URL in your .env file.');
      console.error('It seems the Supabase server address is incorrect or unreachable.');
      console.error('--------------------------------------------------');
    } else {
      console.error(`Database deletion error for item ${id}:`, error);
    }
    return { success: false };
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
        return orders as RecentOrder[];
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

// USERS
export async function getUsers(): Promise<ManagedUser[]> {
    return getAllFromTable<ManagedUser>('users');
}

// COMMUNICATIONS
export async function getCommunications(): Promise<Communication[]> {
    return getAllFromTable<Communication>('communications');
}

// GALLERY
export async function getGalleryPosts(): Promise<GalleryPost[]> {
    return getAllFromTable<GalleryPost>('galleryPosts');
}

// SECURITY
export async function getSecurityReports(): Promise<SecurityReport[]> {
    return getAllFromTable<SecurityReport>('securityReports');
}

export async function getRegisteredVehicles(): Promise<RegisteredVehicle[]> {
    return getAllFromTable<RegisteredVehicle>('registeredVehicles');
}


// FUEL
export async function getFuelHistory(): Promise<FuelHistoryEntry[]> {
    return getAllFromTable<FuelHistoryEntry>('fuelHistory');
}

export async function getFuelLevels() {
    try {
        const result = await db
            .select({
                fuelType: schema.fuelHistory.fuelType,
                total: sql<number>`sum(case when type = 'Abastecimiento' then quantity else -quantity end)`.mapWith(Number),
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
        const canViewAll = currentUser.role === 'Administrador' || currentUser.area === 'Gerencia';

        const recentOrdersPromise = db.query.orders.findMany({
            orderBy: [desc(schema.orders.date)],
            limit: 5,
            with: { items: { columns: { id: true } } }
        });

        const expiringProductsPromise = db.query.inventoryItems.findMany({
            where: and(
                gte(schema.inventoryItems.stock, 1),
                lte(sql`expiry_date`, sql`CURRENT_DATE + 30`),
                gte(sql`expiry_date`, sql`CURRENT_DATE`)
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

        const [recentOrders, expiringProducts, inventoryStats, pendingOrders, fuelLevels] = await Promise.all([
            recentOrdersPromise,
            expiringProductsPromise,
            inventoryStatsPromise,
            pendingOrdersCountPromise,
            fuelLevelsPromise,
        ]);
        
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
        // Return default/empty data to prevent the page from crashing
        return {
          recentOrders: [],
          expiringProducts: [],
          totalInventoryItems: 0,
          pendingOrdersCount: 0,
          fuelLevels: { Gasolina: 0, Petróleo: 0 },
        };
    }
}
