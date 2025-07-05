
import type { InventoryItem, RecentOrder, InventoryHistoryEntry, Notification, FuelHistoryEntry, SecurityReport, GalleryPost, ManagedUser, Communication, RegisteredVehicle } from './types';

export const inventoryData: InventoryItem[] = [];
export let recentOrdersData: RecentOrder[] = [];
export const inventoryHistoryData: InventoryHistoryEntry[] = [];
export const communicationsData: Communication[] = [];
export let notificationsData: Notification[] = [];
export const fuelHistoryData: FuelHistoryEntry[] = [];
export const registeredVehiclesData: RegisteredVehicle[] = [];
export const securityReportsData: SecurityReport[] = [];
export const galleryPostsData: GalleryPost[] = [];
export let usersData: ManagedUser[] = [
    { 
    id: 'usr_gabriel', 
    name: 'Gabriel T', 
    area: 'Administrador', 
    role: 'Administrador', 
    password: '003242373', 
    signatureUrl: 'https://placehold.co/200x80.png?text=Firma+GT', 
    whatsappNumber: '51987654321' 
  },
];
export const fuelLevelsData = {
  Gasolina: 0,
  Petróleo: 0,
};
