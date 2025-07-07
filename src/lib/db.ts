import { supabase } from './supabase';
import type { InventoryItem, RecentOrder, ManagedUser, SecurityReport, GalleryPost, Communication, FuelHistoryEntry, User, RegisteredVehicle, InventoryHistoryEntry, CompanySettings, Notification, ExpiringProduct, FuelType } from './types';
import { differenceInDays, parseISO } from 'date-fns';


// ==================
// This file uses the Supabase client to query the database.
// All functions are async to maintain the same signature as a real DB query.
// ==================


// INVENTORY
export async function getInventoryItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from('inventory_items').select('*').order('name');
  if (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }
  return data || [];
}

export async function getInventoryHistory(): Promise<InventoryHistoryEntry[]> {
    const { data, error } = await supabase
        .from('inventory_history')
        .select('*, users(name, last_name)')
        .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching inventory history:', error);
      return [];
    }
    return data || [];
}


// ORDERS
export async function getOrders(): Promise<RecentOrder[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*, users(name, last_name)')
        .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    return data || [];
}

// USERS
export async function getUsers(): Promise<ManagedUser[]> {
    const { data, error } = await supabase.from('users').select('id, username, name, last_name, email, role, area, status, avatar_url, signature_url').order('name');
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return data || [];
}

// COMMUNICATIONS
export async function getCommunications(): Promise<Communication[]> {
    const { data, error } = await supabase
        .from('communications')
        .select('*, users(name, last_name)')
        .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching communications:', error);
      return [];
    }
    return data || [];
}

// GALLERY
export async function getGalleryPosts(): Promise<GalleryPost[]> {
    const { data, error } = await supabase
        .from('gallery_posts')
        .select('*, users(name, last_name)')
        .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching gallery posts:', error);
      return [];
    }
    return data || [];
}

// SECURITY
export async function getSecurityReports(): Promise<SecurityReport[]> {
    const { data, error } = await supabase
        .from('security_reports')
        .select('*, users(name, last_name)')
        .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching security reports:', error);
      return [];
    }
    return data || [];
}

export async function getRegisteredVehicles(): Promise<RegisteredVehicle[]> {
    const { data, error } = await supabase
        .from('registered_vehicles')
        .select('*, users(name, last_name)');
    if (error) {
      console.error('Error fetching registered vehicles:', error);
      return [];
    }
    return data || [];
}


// FUEL
export async function getFuelHistory(): Promise<FuelHistoryEntry[]> {
    const { data, error } = await supabase
        .from('fuel_history')
        .select('*, users(name, last_name)')
        .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching fuel history:', error);
      return [];
    }
    return data || [];
}

export async function getFuelLevels(): Promise<{ [key in FuelType]: number }> {
    const { data, error } = await supabase.from('fuel_levels').select('*');
    if (error) {
        console.error('Error fetching fuel levels:', error);
        return { Gasolina: 0, Petróleo: 0 };
    }
    
    const levels = data.reduce((acc, curr) => {
        acc[curr.fuel_type as FuelType] = curr.level;
        return acc;
    }, {} as { [key in FuelType]: number });

    return levels;
}

// DASHBOARD
export async function getDashboardData(currentUser: { area: string, role: string }) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();

    const [ordersResult, inventoryResult, fuelLevelsResult] = await Promise.all([
        supabase.from('orders').select('*, users(name, last_name)').order('date', { ascending: false }).limit(5),
        supabase.from('inventory_items').select('name, batches'),
        supabase.from('fuel_levels').select('*')
    ]);
    
    if (ordersResult.error) console.error("Dashboard Orders Error:", ordersResult.error);
    if (inventoryResult.error) console.error("Dashboard Inventory Error:", inventoryResult.error);
    if (fuelLevelsResult.error) console.error("Dashboard Fuel Error:", fuelLevelsResult.error);

    const allRecentOrders = ordersResult.data || [];
    const inventoryItems = inventoryResult.data || [];
    
    const expiringLotes: ExpiringProduct[] = inventoryItems.flatMap(item => 
        (item.batches || [])
            .filter((batch: any) => batch.expiry_date && batch.stock > 0)
            .map((batch: any) => ({ ...batch, item }))
    )
    .filter((batchInfo: any) => {
        const expiry = parseISO(batchInfo.expiry_date!);
        return expiry <= thirtyDaysFromNow && expiry >= today;
    })
    .sort((a: any, b: any) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
    .map((batchInfo: any) => {
        const daysLeft = differenceInDays(parseISO(batchInfo.expiry_date!), today);
        return {
            name: batchInfo.item.name,
            stock: batchInfo.stock,
            expires_in: daysLeft <= 0 ? 'Vencido' : `${daysLeft} días`,
            lote_id: batchInfo.id,
        };
    });

    const { count: pendingOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'Pendiente');
    const { count: totalInventoryItems } = await supabase.from('inventory_items').select('*', { count: 'exact', head: true });
    
    const fuelLevels = (fuelLevelsResult.data || []).reduce((acc, curr) => {
        acc[curr.fuel_type as FuelType] = curr.level;
        return acc;
    }, { Gasolina: 0, Petróleo: 0 } as { [key in FuelType]: number });

    return {
        recentOrders: allRecentOrders,
        expiringProducts: expiringLotes.slice(0, 5),
        totalInventoryItems: totalInventoryItems || 0,
        pendingOrdersCount: pendingOrdersCount || 0,
        fuelLevels: fuelLevels,
    };
}


// NOTIFICATIONS
export async function getNotifications(recipientId: string): Promise<Notification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${recipientId},recipient_id.eq.Administrador`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
    return data || [];
}

// COMPANY SETTINGS
export async function getCompanySettings(): Promise<CompanySettings> {
    const { data, error } = await supabase.from('company_settings').select('*').eq('id', 1).single();
    if (error || !data) {
        console.error('Could not fetch company settings, returning default.', error);
        return { id: 1, support_whats_app: '+123456789', logo_url: null, login_bg_url: null };
    }
    return data;
}
